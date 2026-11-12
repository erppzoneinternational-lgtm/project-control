'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  FolderTree, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Layers, 
  Search, 
  X, 
  Maximize2, 
  Minimize2, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  HardHat
} from 'lucide-react';
import { BoqItem } from '@/types/boq';
import { PriceGate } from './PriceGate';

export interface DivisionTreeNode {
  id: string;                          // Unique key, e.g. 'all', 'div_M', 'tag_M_Villa1'
  key: string;                         // Value passed to filter, e.g. 'M', 'E', or 'all'
  type: 'root' | 'division' | 'subgroup';
  prefix?: string;
  labelAr: string;
  labelEn?: string;
  badgeColor?: string;
  color?: string;
  itemCount: number;
  totalAmountEgp: number;
  pricedCount: number;
  children?: DivisionTreeNode[];
}

interface BoqDivisionTreeProps {
  items: BoqItem[];
  selectedDivision: string;            // 'all' or prefix 'M', 'E', etc.
  onSelectDivision: (divisionKey: string) => void;
  className?: string;
}

// Enterprise Cost Divisions Configuration matching standard ERP Master Format
const ENTERPRISE_DIVISIONS_META: Record<
  string, 
  { labelAr: string; labelEn: string; prefix: string; badge: string; color: string }
> = {
  M: {
    labelAr: 'المواد والتوريدات',
    labelEn: 'Materials & Supplies',
    prefix: 'M',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    color: 'text-blue-600 dark:text-blue-400',
  },
  E: {
    labelAr: 'المعدات ومصاريف الموقع',
    labelEn: 'Equipment & Overheads',
    prefix: 'E',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    color: 'text-amber-600 dark:text-amber-400',
  },
  L: {
    labelAr: 'العمالة المباشرة',
    labelEn: 'Direct Labour',
    prefix: 'L',
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  R: {
    labelAr: 'الإيرادات والمستخلصات',
    labelEn: 'Revenue & Invoicing',
    prefix: 'R',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  A: {
    labelAr: 'المخصصات والتسويات',
    labelEn: 'Accruals & Adjustments',
    prefix: 'A',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    color: 'text-rose-600 dark:text-rose-400',
  },
  S: {
    labelAr: 'مقاولو الباطن',
    labelEn: 'Subcontractors',
    prefix: 'S',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    color: 'text-purple-600 dark:text-purple-400',
  },
  OTHER: {
    labelAr: 'أقسام مخصصة وأخرى',
    labelEn: 'Other Divisions',
    prefix: 'O',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    color: 'text-slate-600 dark:text-slate-400',
  },
  UNASSIGNED: {
    labelAr: 'بنود بدون كود تكلفة',
    labelEn: 'Unassigned Items',
    prefix: '?',
    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
    color: 'text-zinc-500 dark:text-zinc-400',
  },
};

export const BoqDivisionTree: React.FC<BoqDivisionTreeProps> = ({
  items,
  selectedDivision,
  onSelectDivision,
  className = '',
}) => {
  const [treeSearch, setTreeSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all', 'div_M', 'div_E']));
  const [focusedNodeId, setFocusedNodeId] = useState<string>('all');
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Build Hierarchical Tree Structure from items
  const rootNode: DivisionTreeNode = useMemo(() => {
    const totalCount = items.length;
    const totalSum = items.reduce((sum, it) => sum + (Number(it.amount_egp) || 0), 0);
    const pricedTotal = items.filter((it) => Number(it.rate_egp) > 0).length;

    // Group items by division prefix (M, E, L, R, A, S, other, unassigned)
    const divisionGroups: Record<string, { items: BoqItem[]; subGroups: Record<string, BoqItem[]> }> = {
      M: { items: [], subGroups: {} },
      E: { items: [], subGroups: {} },
      L: { items: [], subGroups: {} },
      R: { items: [], subGroups: {} },
      A: { items: [], subGroups: {} },
      S: { items: [], subGroups: {} },
      OTHER: { items: [], subGroups: {} },
      UNASSIGNED: { items: [], subGroups: {} },
    };

    items.forEach((item) => {
      const prefix = item.cost_code?.prefix?.toUpperCase() || item.cost_code?.code?.[0]?.toUpperCase();
      let divKey = 'OTHER';

      if (!item.cost_code) {
        divKey = 'UNASSIGNED';
      } else if (prefix && divisionGroups[prefix]) {
        divKey = prefix;
      } else {
        divKey = 'OTHER';
      }

      divisionGroups[divKey].items.push(item);

      // Subgroup by building_tag or cost_code category if present
      const rawTag = (item as BoqItem & { building_tag?: string }).building_tag || item.cost_code?.category || '';
      const subTag = rawTag.trim();
      if (subTag) {
        if (!divisionGroups[divKey].subGroups[subTag]) {
          divisionGroups[divKey].subGroups[subTag] = [];
        }
        divisionGroups[divKey].subGroups[subTag].push(item);
      }
    });

    const divisionNodes: DivisionTreeNode[] = [];

    // Order of divisions: M, E, L, R, A, S, OTHER, UNASSIGNED
    const keysOrder = ['M', 'E', 'L', 'R', 'A', 'S', 'OTHER', 'UNASSIGNED'];

    keysOrder.forEach((k) => {
      const g = divisionGroups[k];
      if (g.items.length === 0) return; // Only include divisions with items

      const meta = ENTERPRISE_DIVISIONS_META[k];
      const divSum = g.items.reduce((s, it) => s + (Number(it.amount_egp) || 0), 0);
      const divPriced = g.items.filter((it) => Number(it.rate_egp) > 0).length;

      // Build subgroups
      const subGroupNodes: DivisionTreeNode[] = [];
      Object.entries(g.subGroups).forEach(([subTag, subItems]) => {
        const subSum = subItems.reduce((s, it) => s + (Number(it.amount_egp) || 0), 0);
        const subPriced = subItems.filter((it) => Number(it.rate_egp) > 0).length;
        subGroupNodes.push({
          id: `sub_${k}_${subTag}`,
          key: k, // Selecting child still filters by division or could be tag
          type: 'subgroup',
          prefix: meta.prefix,
          labelAr: subTag,
          labelEn: subTag,
          badgeColor: meta.badge,
          color: meta.color,
          itemCount: subItems.length,
          totalAmountEgp: subSum,
          pricedCount: subPriced,
        });
      });

      divisionNodes.push({
        id: `div_${k}`,
        key: k,
        type: 'division',
        prefix: meta.prefix,
        labelAr: meta.labelAr,
        labelEn: meta.labelEn,
        badgeColor: meta.badge,
        color: meta.color,
        itemCount: g.items.length,
        totalAmountEgp: divSum,
        pricedCount: divPriced,
        children: subGroupNodes.length > 0 ? subGroupNodes : undefined,
      });
    });

    return {
      id: 'all',
      key: 'all',
      type: 'root',
      prefix: 'Σ',
      labelAr: 'كافة أقسام وبنود المقايسة',
      labelEn: 'All BOQ Divisions',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      color: 'text-emerald-700 dark:text-emerald-400',
      itemCount: totalCount,
      totalAmountEgp: totalSum,
      pricedCount: pricedTotal,
      children: divisionNodes,
    };
  }, [items]);

  // Flattened visible list for keyboard navigation
  const visibleNodes = useMemo(() => {
    const list: DivisionTreeNode[] = [rootNode];

    const traverse = (node: DivisionTreeNode) => {
      if (node.children && expandedNodes.has(node.id)) {
        node.children.forEach((child) => {
          // If searching, check search match
          if (treeSearch.trim()) {
            const q = treeSearch.toLowerCase();
            const matchesChild = child.labelAr.toLowerCase().includes(q) || (child.labelEn && child.labelEn.toLowerCase().includes(q)) || (child.prefix && child.prefix.toLowerCase().includes(q));
            if (matchesChild) {
              list.push(child);
              traverse(child);
            }
          } else {
            list.push(child);
            traverse(child);
          }
        });
      }
    };

    traverse(rootNode);
    return list;
  }, [rootNode, expandedNodes, treeSearch]);

  // Toggle node expand/collapse
  const toggleExpand = useCallback((nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = () => {
    const allIds = new Set<string>(['all']);
    if (rootNode.children) {
      rootNode.children.forEach((c) => {
        allIds.add(c.id);
        if (c.children) {
          c.children.forEach((sub) => allIds.add(sub.id));
        }
      });
    }
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Keyboard navigation handler with ARIA Tree spec
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = visibleNodes.findIndex((n) => n.id === focusedNodeId);
    if (currentIndex === -1) return;

    const currentNode = visibleNodes[currentIndex];
    const isExpanded = expandedNodes.has(currentNode.id);
    const hasChildren = currentNode.children && currentNode.children.length > 0;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = Math.min(visibleNodes.length - 1, currentIndex + 1);
        const nextNode = visibleNodes[nextIndex];
        setFocusedNodeId(nextNode.id);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        const prevNode = visibleNodes[prevIndex];
        setFocusedNodeId(prevNode.id);
        break;
      }
      // RTL: ArrowLeft opens / steps deeper, ArrowRight closes / steps up
      case 'ArrowLeft': {
        e.preventDefault();
        if (hasChildren && !isExpanded) {
          toggleExpand(currentNode.id);
        } else if (hasChildren && isExpanded) {
          // move to first child
          const firstChild = currentNode.children![0];
          setFocusedNodeId(firstChild.id);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (hasChildren && isExpanded) {
          toggleExpand(currentNode.id);
        } else {
          // find parent and focus it
          if (currentNode.type === 'subgroup') {
            const parent = rootNode.children?.find((c) => c.children?.some((s) => s.id === currentNode.id));
            if (parent) setFocusedNodeId(parent.id);
          } else if (currentNode.type === 'division') {
            setFocusedNodeId(rootNode.id);
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        onSelectDivision(currentNode.key);
        if (hasChildren) {
          toggleExpand(currentNode.id);
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        setFocusedNodeId(visibleNodes[0].id);
        break;
      }
      case 'End': {
        e.preventDefault();
        setFocusedNodeId(visibleNodes[visibleNodes.length - 1].id);
        break;
      }
      case '*': {
        e.preventDefault();
        expandAll();
        break;
      }
      default:
        break;
    }
  };

  // Render a Tree Node Item with proper ARIA attributes
  const renderNode = (node: DivisionTreeNode, level: number = 1) => {
    const isSelected = selectedDivision === node.key;
    const isExpanded = expandedNodes.has(node.id);
    const isFocused = focusedNodeId === node.id;
    const hasChildren = Boolean(node.children && node.children.length > 0);

    const pricedPct = node.itemCount > 0 ? Math.round((node.pricedCount / node.itemCount) * 100) : 0;

    return (
      <div key={node.id} role="none" className="w-full select-none">
        <div
          role="treeitem"
          id={`treeitem-${node.id}`}
          tabIndex={isFocused ? 0 : -1}
          aria-level={level}
          aria-selected={isSelected}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={`${node.labelAr} - ${node.itemCount} بند`}
          onClick={() => {
            setFocusedNodeId(node.id);
            onSelectDivision(node.key);
          }}
          className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition text-xs relative ${
            isSelected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold shadow-sm ring-1 ring-emerald-500/30'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          } ${isFocused ? 'ring-2 ring-emerald-600 dark:ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
          style={{ paddingInlineStart: `${Math.max(12, level * 14)}px` }}
        >
          {/* Active selection indicator bar */}
          {isSelected && (
            <div className="absolute start-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 dark:bg-emerald-500 rounded-e-full" />
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Expand / Collapse Chevron Button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                tabIndex={-1}
                aria-hidden="true"
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" aria-hidden="true" />
            )}

            {/* Division Prefix Pill */}
            {node.prefix && (
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border ${
                  node.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {node.prefix}
              </span>
            )}

            {/* Node Title */}
            <span className="truncate font-medium text-slate-900 dark:text-slate-100" title={node.labelAr}>
              {node.labelAr}
            </span>
          </div>

          {/* Counts & Value Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                isSelected
                  ? 'bg-emerald-200/50 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {node.itemCount}
            </span>

            {/* Price sum (Masked for non-financial roles) */}
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 hidden xl:inline">
              <PriceGate>
                <span dir="ltr">{Number(node.totalAmountEgp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </PriceGate>
            </span>
          </div>
        </div>

        {/* Child Group with role="group" */}
        {hasChildren && isExpanded && (
          <div role="group" className="space-y-0.5 mt-0.5 border-s border-slate-200/60 dark:border-slate-800 ms-3">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden ${className}`}
      aria-label="مستكشف أقسام المقايسة (BOQ Division Explorer)"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              أقسام المقايسة (Divisions)
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              تصفية الشجرة والتكلفة
            </p>
          </div>
        </div>

        {/* Expand / Collapse All Quick Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="توسيع كافة الأقسام (Expand All)"
            aria-label="توسيع كافة الأقسام"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="طي كافة الأقسام (Collapse All)"
            aria-label="طي كافة الأقسام"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree Search Box */}
      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
          <input
            type="text"
            placeholder="بحث في شجرة الأقسام..."
            value={treeSearch}
            onChange={(e) => setTreeSearch(e.target.value)}
            className="w-full ps-8 pe-7 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          />
          {treeSearch && (
            <button
              onClick={() => setTreeSearch('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Accessible Tree Container */}
      <div
        ref={treeContainerRef}
        role="tree"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="شجرة تصنيفات المقايسة والأقسام (BOQ Division Tree)"
        className="p-2 space-y-1 overflow-y-auto max-h-[600px] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 rounded-b-2xl"
      >
        {renderNode(rootNode, 1)}

        {/* Active Filter Helper Bar */}
        {selectedDivision !== 'all' && (
          <div className="pt-2 px-1">
            <button
              onClick={() => onSelectDivision('all')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition"
            >
              <X className="w-3 h-3 text-rose-500" />
              <span>إلغاء التصفية وعرض كل الأقسام</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
