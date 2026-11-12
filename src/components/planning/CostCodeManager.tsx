'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Check, 
  FolderTree, 
  Tag, 
  Layers, 
  RefreshCw,
  AlertCircle,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Table as TableIcon,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { CostCode, CostCodeCategory, EnterpriseCostDivision } from '@/types/boq';
import { CostCodeService } from '@/lib/services/costCode.service';
import { BoqService } from '@/lib/services/boq.service';
import { logger } from '@/lib/logger';

/**
 * Retained for backward-compatibility with tests (m3-boq-components.test.ts)
 */
export const COST_CODE_CATEGORIES: { key: CostCodeCategory | 'all'; labelAr: string; labelEn: string; color: string }[] = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { key: 'preliminaries', labelAr: 'أعمال تمهيدية وتحضيرية', labelEn: 'Preliminaries', color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300' },
  { key: 'concrete', labelAr: 'خرسانات وهياكل إنشائية', labelEn: 'Concrete & Structure', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { key: 'finishing', labelAr: 'أعمال تشطيبات ومعمارية', labelEn: 'Finishing & Architectural', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
  { key: 'mech', labelAr: 'أعمال ميكانيكية وتكييف', labelEn: 'Mechanical (HVAC/Plumbing)', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
  { key: 'elec', labelAr: 'أعمال كهربائية وتيار خفيف', labelEn: 'Electrical & Low Current', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
  { key: 'landscape', labelAr: 'أعمال اللاندسكيب والموقع العام', labelEn: 'Landscape & Hardscape', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300' },
  { key: 'water_features', labelAr: 'حمامات سباحة وبحيرات', labelEn: 'Water Features & Pools', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300' },
  { key: 'other', labelAr: 'أخرى ومتنوعة', labelEn: 'Other', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
];

/**
 * Enterprise divisions from the verified live Supabase Master Cost Codes (data_report.md)
 */
export const MASTER_ENTERPRISE_DIVISIONS: EnterpriseCostDivision[] = [
  { key: 'all', labelAr: 'كافة الأقسام', labelEn: 'All Divisions', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { key: 'materials', prefix: 'M', labelAr: 'المواد والتوريدات (M)', labelEn: 'Materials', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', badgeColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { key: 'equipment_overheads', prefix: 'E', labelAr: 'المعدات ومصاريف الموقع (E)', labelEn: 'Equipment & Overheads', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { key: 'labour', prefix: 'L', labelAr: 'العمالة المباشرة (L)', labelEn: 'Direct Labour', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300', badgeColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  { key: 'revenue', prefix: 'R', labelAr: 'الإيرادات والمستخلصات (R)', labelEn: 'Revenue', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { key: 'accruals', prefix: 'A', labelAr: 'المخصصات والتسويات (A)', labelEn: 'Accruals', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300', badgeColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { key: 'subcontractors', prefix: 'S', labelAr: 'مقاولو الباطن (S)', labelEn: 'Subcontractors', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', badgeColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { key: 'other', labelAr: 'أخرى ومخصص', labelEn: 'Other / Custom', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
];

interface CostCodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode?: (code: CostCode) => void;
}

export const CostCodeManager: React.FC<CostCodeManagerProps> = ({
  isOpen,
  onClose,
  onSelectCode,
}) => {
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'headers' | 'leaves' | 'system' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingCode, setEditingCode] = useState<Partial<CostCode> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const data = await CostCodeService.getCostCodes({ is_active: true });
      setCostCodes(data);
    } catch (err) {
      logger.error('Failed to fetch cost codes', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCodes();
    }
  }, [isOpen]);

  const groupHeaders = useMemo(() => costCodes.filter((c) => c.is_header), [costCodes]);

  // KPIs
  const kpis = useMemo(() => {
    const total = costCodes.length;
    const systemCount = costCodes.filter((c) => c.is_system).length;
    const headersCount = costCodes.filter((c) => c.is_header).length;
    const leavesCount = costCodes.filter((c) => !c.is_header).length;
    return { total, systemCount, headersCount, leavesCount };
  }, [costCodes]);

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    let result = costCodes;

    // 1. Division filter
    if (selectedDivision !== 'all') {
      result = result.filter(
        (c) =>
          c.category === selectedDivision ||
          (c.prefix && c.prefix.toUpperCase() === selectedDivision.toUpperCase())
      );
    }

    // 2. Type filter
    if (selectedType === 'headers') {
      result = result.filter((c) => c.is_header);
    } else if (selectedType === 'leaves') {
      result = result.filter((c) => !c.is_header);
    } else if (selectedType === 'system') {
      result = result.filter((c) => c.is_system);
    } else if (selectedType === 'custom') {
      result = result.filter((c) => !c.is_system);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name_ar.toLowerCase().includes(q) ||
          (c.name_en && c.name_en.toLowerCase().includes(q))
      );
    }

    return result;
  }, [costCodes, selectedDivision, selectedType, searchQuery]);

  // Tree View Structure
  const { treeHeaders, treeChildrenMap } = useMemo(() => {
    const headers: CostCode[] = [];
    const childrenMap: Record<string, CostCode[]> = {};

    costCodes.forEach((c) => {
      if (c.is_header) {
        childrenMap[c.code] = [];
      }
    });

    filteredCodes.forEach((c) => {
      if (c.is_header) {
        headers.push(c);
      } else if (c.parent_code && childrenMap[c.parent_code] !== undefined) {
        childrenMap[c.parent_code].push(c);
      }
    });

    return { treeHeaders: headers, treeChildrenMap: childrenMap };
  }, [costCodes, filteredCodes]);

  const toggleHeaderExpand = (code: string) => {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleStartCreate = () => {
    setEditingCode({
      code: '',
      name_ar: '',
      name_en: '',
      category: 'materials',
      parent_code: groupHeaders[0]?.code || '',
      is_header: false,
      is_system: false,
      is_active: true,
    });
    setFormError(null);
    setIsEditing(true);
  };

  const handleStartEdit = (code: CostCode) => {
    if (code.is_system) {
      setFormError('كود التكلفة هذا معتمد نظامياً من الشركة وغير قابل للتعديل (System Cost Code is immutable).');
      return;
    }
    setEditingCode({ ...code });
    setFormError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode?.code?.trim()) {
      setFormError('كود التكلفة مطلوب (Cost code is required)');
      return;
    }
    if (!editingCode?.name_ar?.trim()) {
      setFormError('الاسم باللغة العربية مطلوب (Arabic name is required)');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const result = await CostCodeService.saveCostCode(editingCode);
      if (!result) {
        setFormError('حدث خطأ أثناء حفظ كود التكلفة. تأكد من عدم تكرار الكود.');
        return;
      }
      setIsEditing(false);
      setEditingCode(null);
      await fetchCodes();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      setFormError(errInfo?.message || 'Failed to save cost code');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  دليل أكواد التكلفة الموحدة (Master Cost Codes)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  قاعدة البيانات الحية Supabase
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة التصنيفات القياسية وأكواد التكاليف (388 كود نظامي + 40 مجموعة رئيسية)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/50 text-xs">
          <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">إجمالي الأكواد</div>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{kpis.total}</div>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">أكواد نظامية معتمدة</div>
              <div className="text-base font-bold text-blue-700 dark:text-blue-300 font-mono">{kpis.systemCount}</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">المجموعات الرئيسية</div>
              <div className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono">{kpis.headersCount}</div>
            </div>
            <FolderTree className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">الأكواد التفصيلية</div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">{kpis.leavesCount}</div>
            </div>
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="البحث بالكود القياسي (مثال: M221) أو الاسم بالعربية أو الإنجليزية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'headers' | 'leaves' | 'system' | 'custom')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="all">كل الأنواع</option>
                <option value="headers">المجموعات الرئيسية فقط (40)</option>
                <option value="leaves">الأكواد التفصيلية فقط (348)</option>
                <option value="system">المعتمد نظامياً (Immutable)</option>
                <option value="custom">المخصص المضاف</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="عرض جدولي"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'tree' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="عرض شجري للمجموعات"
                >
                  <FolderTree className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={fetchCodes}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كود مخصص</span>
              </button>
            </div>
          </div>

          {/* Master Enterprise Division Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {MASTER_ENTERPRISE_DIVISIONS.map((div) => {
              const count =
                div.key === 'all'
                  ? costCodes.length
                  : costCodes.filter(
                      (c) => c.category === div.key || (c.prefix && c.prefix === div.prefix)
                    ).length;

              return (
                <button
                  key={div.key}
                  onClick={() => setSelectedDivision(div.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedDivision === div.key
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{div.labelAr}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedDivision === div.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form Modal/Section when creating or editing */}
          {isEditing && editingCode && (
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {editingCode.id ? 'تعديل كود التكلفة المخصص' : 'إنشاء كود تكلفة جديد'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  إلغاء
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود التكلفة (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: M236 أو E150"
                    value={editingCode.code || ''}
                    onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القسم والبادئة (Division / Category) *
                  </label>
                  <select
                    value={editingCode.category || 'materials'}
                    onChange={(e) => setEditingCode({ ...editingCode, category: e.target.value as CostCodeCategory })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {MASTER_ENTERPRISE_DIVISIONS.filter((c) => c.key !== 'all').map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.labelAr} ({c.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم الهندسي بالعربية (Arabic Engineering Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أعمال صب خرسانة عادية للميول"
                    value={editingCode.name_ar || ''}
                    onChange={(e) => setEditingCode({ ...editingCode, name_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم بالإنجليزية (English Title)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plain Concrete Blinding & Screed"
                    value={editingCode.name_en || ''}
                    onChange={(e) => setEditingCode({ ...editingCode, name_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المجموعة الرئيسية الأب (Parent Group)
                  </label>
                  <select
                    value={editingCode.parent_code || ''}
                    onChange={(e) => setEditingCode({ ...editingCode, parent_code: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="">بدون أب (مجموعة رئيسية مستقلة)</option>
                    {groupHeaders.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.code} - {h.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCode.is_header || false}
                      onChange={(e) => setEditingCode({ ...editingCode, is_header: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500 dark:focus:ring-offset-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      مجموعة رئيسية (Group Header)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCode.is_active !== false}
                      onChange={(e) => setEditingCode({ ...editingCode, is_active: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500 dark:focus:ring-offset-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      كود نشط (Active)
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/60">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingCode.id ? 'حفظ التعديلات' : 'إضافة الكود'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* View Mode: Tree vs Table */}
          {viewMode === 'tree' ? (
            /* Tree View (Accordion of 40 Headers) */
            <div className="space-y-2">
              {treeHeaders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد مجموعات رئيسية مطابقة للبحث الحالي
                </div>
              ) : (
                treeHeaders.map((header) => {
                  const children = treeChildrenMap[header.code] || [];
                  const isExpanded = expandedHeaders.has(header.code) || searchQuery.trim().length > 0;

                  return (
                    <div
                      key={header.id || header.code}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
                    >
                      <div
                        onClick={() => toggleHeaderExpand(header.code)}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition border-r-4 border-r-emerald-600"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1 text-slate-400 dark:text-slate-500">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {header.code}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {header.name_ar}
                          </span>
                          {header.name_en && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              ({header.name_en})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                            رئيسي ({children.length} بند تفصيلي)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectCode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCode(header);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold"
                            >
                              اختيار
                            </button>
                          )}
                          <span className="text-[10px] flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="معتمد نظامياً">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {isExpanded && children.length > 0 && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 ps-8 pe-4 py-1">
                          {children.map((child) => (
                            <div
                              key={child.id || child.code}
                              className="flex items-center justify-between py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded-lg transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {child.code}
                                </span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {child.name_ar}
                                </span>
                                {child.name_en && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                    ({child.name_en})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {onSelectCode && (
                                  <button
                                    onClick={() => {
                                      onSelectCode(child);
                                      onClose();
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[11px] font-bold"
                                  >
                                    اختيار
                                  </button>
                                )}
                                {child.is_system ? (
                                  <span className="text-slate-300 dark:text-slate-600" title="معتمد نظامياً">
                                    <Lock className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStartEdit(child)}
                                    className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                                    title="تعديل الكود المخصص"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Table View */
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold">كود التكلفة</th>
                    <th className="px-4 py-3 text-start font-bold">الاسم بالعربية</th>
                    <th className="px-4 py-3 text-start font-bold">الاسم بالإنجليزية</th>
                    <th className="px-4 py-3 text-start font-bold">القسم القياسي</th>
                    <th className="px-4 py-3 text-center font-bold">النوع والاعتماد</th>
                    <th className="px-4 py-3 text-center font-bold">الحالة</th>
                    <th className="px-4 py-3 text-center font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        {loading ? 'جاري تحميل أكواد التكلفة المعتمدة...' : 'لا توجد أكواد تكلفة مطابقة لمعايير البحث'}
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((code) => {
                      const divInfo = MASTER_ENTERPRISE_DIVISIONS.find(
                        (d) => d.key === code.category || (code.prefix && d.prefix === code.prefix)
                      );
                      return (
                        <tr
                          key={code.id || code.code}
                          className={`transition group ${
                            code.is_header
                              ? 'bg-slate-100/60 dark:bg-slate-800/60 font-semibold border-r-4 border-r-emerald-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                            {code.code}
                            {code.parent_code && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                ({code.parent_code})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {code.name_ar}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {code.name_en || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                divInfo?.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {divInfo?.labelAr.split(' ')[0] || code.category || 'other'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {code.is_header ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                  رئيسي
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  تفصيلي
                                </span>
                              )}
                              {code.is_system ? (
                                <span
                                  title="كود نظامي معتمد موحد (Single Source of Truth) - غير قابل للتعديل"
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  معتمد
                                </span>
                              ) : (
                                <span
                                  title="كود مخصص مضاف من المستخدم"
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                >
                                  مخصص
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                code.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {code.is_active ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {onSelectCode && (
                                <button
                                  onClick={() => {
                                    onSelectCode(code);
                                    onClose();
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[11px] font-bold transition"
                                >
                                  اختيار
                                </button>
                              )}
                              {code.is_system ? (
                                <span
                                  className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                  title="كود معتمد غير قابل للتعديل (System code is immutable)"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(code)}
                                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                                  title="تعديل الكود"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
          <span>المعروض: {filteredCodes.length} من إجمالي {costCodes.length} كود تكلفة</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
