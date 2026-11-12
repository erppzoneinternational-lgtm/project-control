'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  FolderTree, 
  Tag, 
  Check, 
  Lock, 
  Layers, 
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { CostCode, CostCodeCategory, EnterpriseCostDivision } from '@/types/boq';
import { CostCodeService } from '@/lib/services/costCode.service';

export const ENTERPRISE_DIVISIONS: EnterpriseCostDivision[] = [
  { 
    key: 'all', 
    labelAr: 'كافة الأقسام', 
    labelEn: 'All Divisions', 
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
  },
  { 
    key: 'materials', 
    prefix: 'M', 
    labelAr: 'المواد والتوريدات (M)', 
    labelEn: 'Materials', 
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
  },
  { 
    key: 'equipment_overheads', 
    prefix: 'E', 
    labelAr: 'المعدات ومصاريف الموقع (E)', 
    labelEn: 'Equipment & Overheads', 
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
  },
  { 
    key: 'labour', 
    prefix: 'L', 
    labelAr: 'العمالة المباشرة (L)', 
    labelEn: 'Direct Labour', 
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
  },
  { 
    key: 'revenue', 
    prefix: 'R', 
    labelAr: 'الإيرادات والمستخلصات (R)', 
    labelEn: 'Revenue', 
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
  },
  { 
    key: 'accruals', 
    prefix: 'A', 
    labelAr: 'المخصصات والتسويات (A)', 
    labelEn: 'Accruals', 
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
  },
  { 
    key: 'subcontractors', 
    prefix: 'S', 
    labelAr: 'مقاولو الباطن (S)', 
    labelEn: 'Subcontractors', 
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
  },
  { 
    key: 'other', 
    labelAr: 'أخرى / مخصص', 
    labelEn: 'Other', 
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  },
];

export interface CostCodeSelectorProps {
  value?: string | null;
  selectedCode?: CostCode | null;
  onChange: (costCode: CostCode | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  divisionFilter?: string;
  className?: string;
  compact?: boolean;
  onOpenManager?: () => void;
}

export const CostCodeSelector: React.FC<CostCodeSelectorProps> = ({
  value,
  selectedCode: initialSelectedCode,
  onChange,
  placeholder = 'اختر كود التكلفة...',
  disabled = false,
  allowClear = true,
  divisionFilter,
  className = '',
  compact = false,
  onOpenManager,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allCodes, setAllCodes] = useState<CostCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>(divisionFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());
  const [currentCode, setCurrentCode] = useState<CostCode | null>(initialSelectedCode || null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync current code if value or initialSelectedCode changes
  useEffect(() => {
    if (initialSelectedCode) {
      setCurrentCode(initialSelectedCode);
    } else if (value && allCodes.length > 0) {
      const match = allCodes.find((c) => c.id === value || c.code === value);
      if (match) setCurrentCode(match);
    } else if (!value) {
      setCurrentCode(null);
    }
  }, [value, initialSelectedCode, allCodes]);

  // Load codes on mount or when modal opens
  const loadCodes = async () => {
    setLoading(true);
    try {
      const data = await CostCodeService.getCostCodes({ is_active: true });
      setAllCodes(data);
      if (value && !currentCode) {
        const found = data.find((c) => c.id === value || c.code === value);
        if (found) setCurrentCode(found);
      }
    } catch (err) {
      console.error('Failed to load cost codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  // Filtered list
  const filteredCodes = useMemo(() => {
    let result = allCodes;

    if (selectedDivision !== 'all') {
      result = result.filter(
        (c) =>
          c.category === selectedDivision ||
          (c.prefix && c.prefix.toUpperCase() === selectedDivision.toUpperCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name_ar.toLowerCase().includes(q) ||
          (c.name_en && c.name_en.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allCodes, selectedDivision, searchQuery]);

  // Tree structure
  const { treeHeaders, treeChildrenMap, standaloneLeaves } = useMemo(() => {
    const headers: CostCode[] = [];
    const childrenMap: Record<string, CostCode[]> = {};
    const standalone: CostCode[] = [];

    // Identify matching headers
    allCodes.forEach((c) => {
      if (c.is_header) {
        childrenMap[c.code] = [];
      }
    });

    filteredCodes.forEach((c) => {
      if (c.is_header) {
        headers.push(c);
      } else if (c.parent_code && childrenMap[c.parent_code] !== undefined) {
        childrenMap[c.parent_code].push(c);
      } else {
        standalone.push(c);
      }
    });

    // If searching, also auto-expand headers that have matching children
    if (searchQuery.trim()) {
      const autoExpanded = new Set<string>();
      Object.entries(childrenMap).forEach(([parentCode, kids]) => {
        if (kids.length > 0) autoExpanded.add(parentCode);
      });
      setExpandedHeaders(autoExpanded);
    }

    return { treeHeaders: headers, treeChildrenMap: childrenMap, standaloneLeaves: standalone };
  }, [allCodes, filteredCodes, searchQuery]);

  const toggleHeader = (headerCode: string) => {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(headerCode)) next.delete(headerCode);
      else next.add(headerCode);
      return next;
    });
  };

  const handleSelect = (code: CostCode) => {
    setCurrentCode(code);
    onChange(code);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCode(null);
    onChange(null);
  };

  const getDivisionInfo = (code?: CostCode | null) => {
    if (!code) return null;
    return ENTERPRISE_DIVISIONS.find(
      (d) => d.key === code.category || (code.prefix && d.prefix === code.prefix)
    );
  };

  const selectedDivInfo = getDivisionInfo(currentCode);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button / Input Display */}
      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
            currentCode
              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              : 'border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={currentCode ? `${currentCode.code} - ${currentCode.name_ar}` : placeholder}
        >
          {currentCode ? (
            <>
              <span className="text-emerald-700 dark:text-emerald-400">{currentCode.code}</span>
              {allowClear && !disabled && (
                <span
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] font-sans font-normal">+ كود التكلفة</span>
          )}
        </button>
      ) : (
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs border transition ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800' : 'cursor-pointer bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            {currentCode ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] shrink-0 border border-emerald-200 dark:border-emerald-800">
                  {currentCode.code}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentCode.name_ar}
                </span>
                {currentCode.name_en && (
                  <span className="text-slate-400 text-[10px] truncate hidden sm:inline">
                    ({currentCode.name_en})
                  </span>
                )}
                {selectedDivInfo && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${
                      selectedDivInfo.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {selectedDivInfo.labelAr.split(' ')[0]}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {currentCode && allowClear && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="إلغاء تعيين كود التكلفة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      {/* Selector Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    اختيار كود التكلفة المعتمد (Select Master Cost Code)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    388 كود تكلفة قياسي معتمد من النظام موزعة على 6 أقسام رئيسية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenManager && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenManager();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                    title="فتح إدارة دليل أكواد التكلفة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>الدليل الشامل</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Controls: Search, View Mode & Division Tabs */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/30 dark:bg-slate-800/40">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="ابحث بالكود (M221) أو الاسم بالعربية أو الإنجليزية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      viewMode === 'tree'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>شجري</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>قائمة</span>
                  </button>
                </div>
              </div>

              {/* Enterprise Division Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {ENTERPRISE_DIVISIONS.map((div) => (
                  <button
                    key={div.key}
                    type="button"
                    onClick={() => setSelectedDivision(div.key)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedDivision === div.key
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {div.labelAr}
                  </button>
                ))}
              </div>
            </div>

            {/* List / Tree Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>جاري تحميل أكواد التكلفة المعتمدة...</span>
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  لا توجد أكواد تكلفة مطابقة لمعايير البحث
                </div>
              ) : viewMode === 'tree' ? (
                /* Tree View */
                <div className="space-y-2">
                  {/* Option to clear */}
                  {allowClear && currentCode && (
                    <div
                      onClick={() => {
                        onChange(null);
                        setCurrentCode(null);
                        setIsOpen(false);
                      }}
                      className="p-3 rounded-xl border border-dashed border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition flex items-center justify-between"
                    >
                      <span>إلغاء التعيين (بدون كود تكلفة)</span>
                      <X className="w-4 h-4" />
                    </div>
                  )}

                  {/* Render Headers and their Leaf children */}
                  {treeHeaders.map((header) => {
                    const children = treeChildrenMap[header.code] || [];
                    const isExpanded = expandedHeaders.has(header.code) || searchQuery.trim().length > 0;
                    const isHeaderSelected = currentCode?.id === header.id || currentCode?.code === header.code;
                    const divInfo = getDivisionInfo(header);

                    return (
                      <div
                        key={header.id || header.code}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
                      >
                        {/* Header Row */}
                        <div
                          className={`flex items-center justify-between p-3 cursor-pointer transition ${
                            isHeaderSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-s-4 border-s-emerald-600'
                              : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => toggleHeader(header.code)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="p-1 rounded text-slate-400">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                              {header.code}
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {header.name_ar}
                            </span>
                            {header.name_en && (
                              <span className="text-[11px] text-slate-400">
                                ({header.name_en})
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
                              رئيسي ({children.length})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {header.is_system && (
                              <span
                                className="text-[10px] flex items-center gap-0.5 text-blue-600 dark:text-blue-400"
                                title="معتمد نظامياً"
                              >
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(header);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isHeaderSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {isHeaderSelected ? 'تم الاختيار' : 'اختيار الكود'}
                            </button>
                          </div>
                        </div>

                        {/* Children List */}
                        {isExpanded && children.length > 0 && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 ps-6">
                            {children.map((child) => {
                              const isChildSelected =
                                currentCode?.id === child.id || currentCode?.code === child.code;
                              return (
                                <div
                                  key={child.id || child.code}
                                  onClick={() => handleSelect(child)}
                                  className={`group flex items-center justify-between p-2.5 cursor-pointer transition ${
                                    isChildSelected
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-s-4 border-s-emerald-600'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                      {child.code}
                                    </span>
                                    <span className="text-xs text-slate-900 dark:text-slate-100 font-medium">
                                      {child.name_ar}
                                    </span>
                                    {child.name_en && (
                                      <span className="text-[11px] text-slate-400">
                                        ({child.name_en})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isChildSelected ? (
                                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                        <Check className="w-4 h-4" />
                                        <span>محدد</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                        اختيار
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Standalone Leaf Codes (without matching header) */}
                  {standaloneLeaves.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[11px] font-bold text-slate-400 mb-1 px-1">
                        أكواد تفصيلية مستقلة ({standaloneLeaves.length})
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        {standaloneLeaves.map((code) => {
                          const isSelected =
                            currentCode?.id === code.id || currentCode?.code === code.code;
                          return (
                            <div
                              key={code.id || code.code}
                              onClick={() => handleSelect(code)}
                              className={`flex items-center justify-between p-2.5 cursor-pointer transition ${
                                isSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-s-4 border-s-emerald-600'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                  {code.code}
                                </span>
                                <span className="text-xs text-slate-900 dark:text-slate-100">
                                  {code.name_ar}
                                </span>
                                {code.name_en && (
                                  <span className="text-[11px] text-slate-400">({code.name_en})</span>
                                )}
                              </div>
                              <button
                                type="button"
                                className={`px-2.5 py-0.5 rounded text-xs font-bold transition ${
                                  isSelected ? 'bg-emerald-700 text-white' : 'text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                                }`}
                              >
                                {isSelected ? 'محدد' : 'اختيار'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Flat List View */
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  {allowClear && currentCode && (
                    <div
                      onClick={() => {
                        onChange(null);
                        setCurrentCode(null);
                        setIsOpen(false);
                      }}
                      className="p-3 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition flex items-center justify-between"
                    >
                      <span>إلغاء التعيين (بدون كود تكلفة)</span>
                      <X className="w-4 h-4" />
                    </div>
                  )}
                  {filteredCodes.map((code) => {
                    const isSelected = currentCode?.id === code.id || currentCode?.code === code.code;
                    const divInfo = getDivisionInfo(code);

                    return (
                      <div
                        key={code.id || code.code}
                        onClick={() => handleSelect(code)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-s-4 border-s-emerald-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            {code.code}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{code.name_ar}</span>
                              {code.is_header && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                                  رئيسي
                                </span>
                              )}
                              {code.is_system && (
                                <span
                                  className="text-[10px] flex items-center text-blue-600 dark:text-blue-400"
                                  title="معتمد نظامياً"
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            {code.name_en && (
                              <div className="text-[10px] text-slate-400">{code.name_en}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {divInfo && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border hidden sm:inline ${
                                divInfo.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {divInfo.labelAr}
                            </span>
                          )}
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isSelected ? 'محدد' : 'اختيار'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
              <span>المعروض: {filteredCodes.length} كود تكلفة</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
