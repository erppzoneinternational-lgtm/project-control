'use client';

/**
 * Activity → BOQ Allocation Board & Matrix v3.1
 *
 * 1. Two-way synchronization with useProjectStore (activeProjectId, setActiveProjectId).
 * 2. Purified Arabic interface (Zero English words mixed in Arabic sentences).
 * 3. Polished table controls: multi-column sorting, filter reset, clearable search, refresh button.
 * 4. Inline numeric allocation editor with accessible shortcuts and validation.
 * 5. Total balance indicators and simulation bar for real-time quantity validation.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { classifyActivity as classify } from '@/lib/planning/activityClassifier';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import {
  Split, Building2, Loader2, Link2, Unlink, Search,
  Layers, ListTodo, ChevronDown, ChevronRight, ChevronUp, Filter, CheckSquare, Square,
  TreePine, Check, AlertTriangle, CheckCircle2,
  Table as TableIcon, LayoutGrid, ArrowUpDown, RefreshCw, X, Edit3, Save, Info,
  Scale, Hash, FolderTree,
} from 'lucide-react';

interface Act {
  id: string;
  code: string | null;
  name_ar: string | null;
  duration_days: number | null;
  percent_complete: number | null;
  is_critical: boolean | null;
  discipline: string;
  structure: string;
}

interface BoqRow {
  id: string;
  item_code: string | null;
  description_ar: string | null;
  unit: string | null;
  contract_qty: number | null;
  rate_egp: number | null;
  group_tag: string;
}

interface LinkRow {
  id: string;
  activity_id: string;
  boq_item_id: string;
  planned_qty: number | null;
}

/* ═══ Multi-select filter dropdown ═══ */
function MultiSelect({
  label,
  options,
  selected,
  onChange,
  isAr = true,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  isAr?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  };

  const summary =
    selected.size === 0
      ? label
      : selected.size === 1
      ? [...selected][0]
      : isAr
      ? `${label}: ${selected.size} محدد`
      : `${label}: ${selected.size} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={isAr ? `تصفية حسب ${label}` : `Filter by ${label}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
          selected.size > 0
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
        }`}
      >
        <Filter className="w-3 h-3" aria-hidden="true" />
        <span>{summary}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={isAr ? `قائمة خيارات ${label}` : `${label} options list`}
          className="absolute z-30 mt-1 w-56 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-end"
        >
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="w-full text-end px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800"
          >
            {isAr ? 'مسح التحديد' : 'Clear selection'}
          </button>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => toggle(opt)}
                aria-label={opt}
                className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-300">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Tree node interface ═══ */
interface TreeNode {
  key: string;
  label: string;
  count: number;
  children?: TreeNode[];
  acts?: Act[];
  depth: number;
}

type SortField = 'act' | 'disc' | 'boq' | 'unit' | 'contract' | 'allocated' | 'pct' | 'balance' | 'status';

export default function AllocationPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles: userRoles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/planning/allocation', userRoles || [], isAdmin, dbAccessRules) ||
      canEditPath('/planning', userRoles || [], isAdmin, dbAccessRules));

  /* ── Two-way synchronization with useProjectStore ── */
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  const [projects, setProjects] = useState<{ id: string; label: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [projectLabel, setProjectLabel] = useState<string>('');

  const [acts, setActs] = useState<Act[]>([]);
  const [boqRows, setBoqRows] = useState<BoqRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* View mode: 'matrix' (Matrix Table) | 'tree' (Hierarchical Tree & Bulk Link) */
  const [viewMode, setViewMode] = useState<'matrix' | 'tree'>('matrix');

  /* Tree filters */
  const [discFilter, setDiscFilter] = useState<Set<string>>(new Set());
  const [structFilter, setStructFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  /* Matrix table filters & sort */
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<'all' | 'balanced' | 'partial' | 'over'>('all');
  const [matrixDisciplineFilter, setMatrixDisciplineFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('act');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  /* Tree expansion & Selection */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());

  /* Linking & Target BOQ Picker */
  const [targetBoq, setTargetBoq] = useState<BoqRow | null>(null);
  const [bulkQty, setBulkQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [boqSearch, setBoqSearch] = useState('');

  /* Inline editing in Matrix Table */
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<string>('');
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

  /* ── Initial Load & Synchronize Projects ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('pm_projects_with_manager')
        .select('id, project_code, project_name')
        .is('deleted_at', null)
        .order('project_code');

      if (!mounted) return;

      const loaded = (data || []).map((p) => ({
        id: p.id,
        label: `#${p.project_code} — ${p.project_name}`,
      }));
      setProjects(loaded);

      // Two-way synchronization on startup
      if (activeProjectId && loaded.some((p) => p.id === activeProjectId)) {
        if (selectedProjectId !== activeProjectId) {
          setSelectedProjectId(activeProjectId);
        }
      } else if (loaded.length > 0 && !selectedProjectId) {
        setSelectedProjectId(loaded[0].id);
        setActiveProjectId(loaded[0].id);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // Run on mount

  /* ── Synchronize from store when external changes occur ── */
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  /* ── Handle project selection ── */
  const handleProjectSelect = (pid: string) => {
    setSelectedProjectId(pid);
    setActiveProjectId(pid);
  };

  /* ── Data Fetcher ── */
  const loadAll = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [actsRes, boqRes, linksRes] = await Promise.all([
        supabase
          .from('pm_project_activities')
          .select('id, code, name_ar, duration_days, percent_complete, is_critical')
          .eq('project_id', pid)
          .eq('is_active', true)
          .limit(4000),
        supabase
          .from('pm_boq_items')
          .select('id, item_code, description_ar, unit, contract_qty, rate_egp, cost_code:cost_code_id(code)')
          .eq('project_id', pid)
          .limit(5000),
        supabase.from('pm_activity_boq_links').select('id, activity_id, boq_item_id, planned_qty'),
      ]);

      setActs(
        ((actsRes.data || []) as unknown as Act[]).map((a) => {
          const { discipline, structure } = classify(a.name_ar || '');
          return { ...a, discipline, structure };
        })
      );

      setBoqRows(
        (boqRes.data || []).map((b) => ({
          id: b.id,
          item_code: b.item_code,
          description_ar: b.description_ar,
          unit: b.unit,
          contract_qty: b.contract_qty,
          rate_egp: b.rate_egp,
          group_tag:
            (b.cost_code as unknown as { code?: string } | null)?.code ||
            (typeof b.cost_code === 'string' ? b.cost_code : '') ||
            '',
        }))
      );

      setLinks((linksRes.data || []) as unknown as LinkRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Re-fetch & reset active states on project switch ── */
  useEffect(() => {
    const p = projects.find((x) => x.id === selectedProjectId);
    setProjectLabel(p?.label || '');
    setChecked(new Set());
    setExpanded(new Set());
    setDiscFilter(new Set());
    setStructFilter(new Set());
    setTargetBoq(null);
    setBulkQty('');
    setEditingLinkId(null);

    if (selectedProjectId) {
      loadAll(selectedProjectId);
    }
  }, [selectedProjectId, projects, loadAll]);

  /* ── Lookup maps ── */
  const actsMap = useMemo(() => new Map(acts.map((a) => [a.id, a])), [acts]);
  const boqMap = useMemo(() => new Map(boqRows.map((b) => [b.id, b])), [boqRows]);

  /* ── Allocation Aggregates per BOQ item ── */
  const allocatedTotalsByBoq = useMemo(() => {
    const map = new Map<string, number>();
    links.forEach((l) => {
      const current = map.get(l.boq_item_id) || 0;
      map.set(l.boq_item_id, current + (Number(l.planned_qty) || 0));
    });
    return map;
  }, [links]);

  /* ── Filter options ── */
  const allDisciplines = useMemo(() => [...new Set(acts.map((a) => a.discipline))].sort(), [acts]);
  const allStructures = useMemo(
    () =>
      [...new Set(acts.filter((a) => !discFilter.size || discFilter.has(a.discipline)).map((a) => a.structure))].sort(),
    [acts, discFilter]
  );

  /* ── Filtered activities for tree ── */
  const filteredActs = useMemo(() => {
    return acts.filter((a) => {
      if (discFilter.size && !discFilter.has(a.discipline)) return false;
      if (structFilter.size && !structFilter.has(a.structure)) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        if (!(a.name_ar || '').toLowerCase().includes(s) && !(a.code || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [acts, discFilter, structFilter, search]);

  /* ── Build hierarchical tree: discipline → structure → activities ── */
  const tree = useMemo<TreeNode[]>(() => {
    const byDisc = new Map<string, Map<string, Act[]>>();
    filteredActs.forEach((a) => {
      if (!byDisc.has(a.discipline)) byDisc.set(a.discipline, new Map());
      const byStruct = byDisc.get(a.discipline)!;
      if (!byStruct.has(a.structure)) byStruct.set(a.structure, []);
      byStruct.get(a.structure)!.push(a);
    });
    return [...byDisc.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'ar'))
      .map(([disc, structs]) => ({
        key: `d:${disc}`,
        label: disc,
        count: [...structs.values()].flat().length,
        depth: 0,
        children: [...structs.entries()]
          .sort((a, b) => a[0].localeCompare(b[0], 'ar'))
          .map(([st, list]) => ({
            key: `s:${disc}:${st}`,
            label: st,
            count: list.length,
            depth: 1,
            acts: list.sort((x, y) => (x.code || '').localeCompare(y.code || '')),
          })),
      }));
  }, [filteredActs]);

  /* IDs under a tree node */
  const idsUnder = (node: TreeNode): string[] => {
    if (node.acts) return node.acts.map((a) => a.id);
    return (node.children || []).flatMap(idsUnder);
  };

  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const expandAll = () => {
    const allKeys = tree.flatMap((d) => [d.key, ...(d.children || []).map((c) => c.key)]);
    setExpanded(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const toggleCheckIds = (ids: string[]) => {
    if (!canEdit) return;
    setChecked((prev) => {
      const n = new Set(prev);
      const allIn = ids.every((id) => n.has(id));
      ids.forEach((id) => (allIn ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  const nodeCheckedState = (node: TreeNode): 'all' | 'some' | 'none' => {
    const ids = idsUnder(node);
    const inCount = ids.filter((id) => checked.has(id)).length;
    if (inCount === 0) return 'none';
    if (inCount === ids.length) return 'all';
    return 'some';
  };

  /* ── BOQ filtered list ── */
  const filteredBoq = useMemo(() => {
    if (!boqSearch.trim()) return boqRows;
    const s = boqSearch.trim().toLowerCase();
    return boqRows.filter(
      (b) => (b.description_ar || '').toLowerCase().includes(s) || (b.item_code || '').toLowerCase().includes(s)
    );
  }, [boqRows, boqSearch]);

  /* ── Target BOQ validation indicators ── */
  const targetCurrentAllocated = useMemo(() => {
    if (!targetBoq) return 0;
    return allocatedTotalsByBoq.get(targetBoq.id) || 0;
  }, [targetBoq, allocatedTotalsByBoq]);

  const targetContractQty = useMemo(() => {
    return Number(targetBoq?.contract_qty) || 0;
  }, [targetBoq]);

  const targetRemainingQty = useMemo(() => {
    return Math.max(0, targetContractQty - targetCurrentAllocated);
  }, [targetContractQty, targetCurrentAllocated]);

  const targetAllocPct = useMemo(() => {
    if (targetContractQty <= 0) return 0;
    return Math.min(100, (targetCurrentAllocated / targetContractQty) * 100);
  }, [targetContractQty, targetCurrentAllocated]);

  const bulkSimulatedTotal = useMemo(() => {
    const qtyPerAct = Number(bulkQty) || 0;
    return targetCurrentAllocated + checked.size * qtyPerAct;
  }, [targetCurrentAllocated, checked.size, bulkQty]);

  const bulkIsOverCapacity = useMemo(() => {
    return targetContractQty > 0 && bulkSimulatedTotal > targetContractQty + 1e-4;
  }, [targetContractQty, bulkSimulatedTotal]);

  const bulkIsFullyBalanced = useMemo(() => {
    return targetContractQty > 0 && Math.abs(bulkSimulatedTotal - targetContractQty) < 1e-4;
  }, [targetContractQty, bulkSimulatedTotal]);

  /* Quick presets for bulk quantity */
  const setQuickAllocation = (fraction: number) => {
    if (!canEdit) return;
    if (!targetBoq || checked.size === 0) return;
    const targetRem = Math.max(0, targetContractQty - targetCurrentAllocated);
    if (targetRem <= 0) {
      toast.warning(isAr ? 'تم توزيع كمية بند المقايسة بالكامل' : 'BOQ item quantity is fully allocated');
      return;
    }
    const portion = (targetRem * fraction) / checked.size;
    const rounded = Math.round(portion * 100) / 100;
    setBulkQty(String(rounded));
  };

  /* ── Bulk Link Action ── */
  const doBulkLink = async () => {
    if (!canEdit) return;
    if (!targetBoq) {
      toast.error(isAr ? 'يرجى اختيار بند المقايسة المستهدف أولاً' : 'Select a target BOQ item first');
      return;
    }
    if (!checked.size) {
      toast.error(isAr ? 'حدد نشاطاً واحداً على الأقل من الشجرة الهيكلية' : 'Select at least one activity from the tree');
      return;
    }
    const qty = Number(bulkQty || targetBoq.contract_qty || 0) || 0;
    if (qty <= 0) {
      toast.error(isAr ? 'أدخل كمية توزيع صالحة أكبر من الصفر' : 'Enter a valid quantity greater than zero');
      return;
    }

    setBusy(true);
    try {
      const { data: boqFull } = await supabase.from('pm_boq_items').select('rate_egp').eq('id', targetBoq.id).single();
      const rows = [...checked].map((actId) => ({
        activity_id: actId,
        boq_item_id: targetBoq.id,
        planned_qty: qty,
        baseline_rate_egp: Number(boqFull?.rate_egp ?? targetBoq.rate_egp ?? 0),
      }));

      const { error } = await supabase
        .from('pm_activity_boq_links')
        .upsert(rows, { onConflict: 'activity_id,boq_item_id' });
      if (error) throw error;

      const { data } = await supabase.from('pm_activity_boq_links').select('id, activity_id, boq_item_id, planned_qty');
      setLinks((data || []) as unknown as LinkRow[]);

      toast.success(
        isAr
          ? `تم ربط ${checked.size} نشاطاً ببند المقايسة "${targetBoq.description_ar?.slice(0, 30)}..."`
          : `Linked ${checked.size} activities to item "${targetBoq.description_ar?.slice(0, 30)}..."`
      );
      setChecked(new Set());
    } catch (e: unknown) {
      console.error(e);
      toast.error(
        isAr
          ? 'فشل ربط الأنشطة: ' + ((e as Error).message || '')
          : 'Failed to link activities: ' + ((e as Error).message || '')
      );
    } finally {
      setBusy(false);
    }
  };

  /* ── Unlink Action ── */
  const doUnlink = async (linkId: string) => {
    if (!canEdit) return;
    try {
      const { error } = await supabase.from('pm_activity_boq_links').delete().eq('id', linkId);
      if (error) throw error;
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast.success(isAr ? 'تم فك الربط بنجاح' : 'Unlinked successfully');
    } catch (e: unknown) {
      toast.error(isAr ? 'فشل فك الربط' : 'Failed to unlink');
    }
  };

  /* ── Inline Edit Link Action ── */
  const startEditLink = (l: LinkRow) => {
    if (!canEdit) return;
    setEditingLinkId(l.id);
    setEditingQty(String(l.planned_qty ?? 0));
  };

  const cancelEditLink = () => {
    setEditingLinkId(null);
    setEditingQty('');
  };

  const saveEditLink = async (linkId: string) => {
    if (!canEdit) return;
    const val = Number(editingQty);
    if (isNaN(val) || val < 0) {
      toast.error(isAr ? 'يرجى إدخال كمية رقمية صحيحة موجبة' : 'Please enter a valid positive numeric quantity');
      return;
    }
    setSavingLinkId(linkId);
    try {
      const { error } = await supabase
        .from('pm_activity_boq_links')
        .update({ planned_qty: val })
        .eq('id', linkId);
      if (error) throw error;
      setLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, planned_qty: val } : l)));
      toast.success(isAr ? 'تم تحديث كمية التوزيع بنجاح' : 'Allocation quantity updated successfully');
      setEditingLinkId(null);
    } catch (e: unknown) {
      toast.error(
        isAr ? 'فشل حفظ الكمية: ' + ((e as Error).message || '') : 'Failed to save quantity: ' + ((e as Error).message || '')
      );
    } finally {
      setSavingLinkId(null);
    }
  };

  /* ── Matrix Table Sorting Handler ── */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  /* ── Matrix Table Rows ── */
  const matrixRows = useMemo(() => {
    const rows = links
      .map((l) => {
        const act = actsMap.get(l.activity_id);
        const boq = boqMap.get(l.boq_item_id);
        const contractQty = Number(boq?.contract_qty) || 0;
        const totalBoqAllocated = allocatedTotalsByBoq.get(l.boq_item_id) || 0;
        const remainingBalance = contractQty - totalBoqAllocated;
        const allocPct = contractQty > 0 ? (totalBoqAllocated / contractQty) * 100 : 0;
        const linkSharePct = contractQty > 0 ? ((l.planned_qty || 0) / contractQty) * 100 : 0;

        let balanceStatus: 'balanced' | 'partial' | 'over' = 'partial';
        if (contractQty > 0) {
          if (totalBoqAllocated > contractQty + 1e-4) balanceStatus = 'over';
          else if (Math.abs(totalBoqAllocated - contractQty) < 1e-4) balanceStatus = 'balanced';
        }

        return {
          link: l,
          act,
          boq,
          contractQty,
          totalBoqAllocated,
          remainingBalance,
          allocPct,
          linkSharePct,
          balanceStatus,
        };
      })
      .filter((row) => {
        if (!row.act || !row.boq) return false;
        if (matrixDisciplineFilter !== 'all' && row.act.discipline !== matrixDisciplineFilter) return false;
        if (matrixStatusFilter !== 'all' && row.balanceStatus !== matrixStatusFilter) return false;
        if (matrixSearch.trim()) {
          const s = matrixSearch.trim().toLowerCase();
          const actName = (row.act.name_ar || '').toLowerCase();
          const actCode = (row.act.code || '').toLowerCase();
          const boqDesc = (row.boq.description_ar || '').toLowerCase();
          const boqCode = (row.boq.item_code || '').toLowerCase();
          const groupTag = (row.boq.group_tag || '').toLowerCase();
          if (
            !actName.includes(s) &&
            !actCode.includes(s) &&
            !boqDesc.includes(s) &&
            !boqCode.includes(s) &&
            !groupTag.includes(s)
          ) {
            return false;
          }
        }
        return true;
      });

    // Sort rows
    rows.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'act':
          comparison = (a.act?.name_ar || '').localeCompare(b.act?.name_ar || '', 'ar');
          break;
        case 'disc':
          comparison = (a.act?.discipline || '').localeCompare(b.act?.discipline || '', 'ar');
          break;
        case 'boq':
          comparison = (a.boq?.description_ar || '').localeCompare(b.boq?.description_ar || '', 'ar');
          break;
        case 'unit':
          comparison = (a.boq?.unit || '').localeCompare(b.boq?.unit || '', 'ar');
          break;
        case 'contract':
          comparison = a.contractQty - b.contractQty;
          break;
        case 'allocated':
          comparison = (a.link.planned_qty || 0) - (b.link.planned_qty || 0);
          break;
        case 'pct':
          comparison = a.allocPct - b.allocPct;
          break;
        case 'balance':
          comparison = a.remainingBalance - b.remainingBalance;
          break;
        case 'status':
          comparison = a.balanceStatus.localeCompare(b.balanceStatus);
          break;
        default:
          comparison = 0;
      }
      return sortAsc ? comparison : -comparison;
    });

    return rows;
  }, [
    links,
    actsMap,
    boqMap,
    allocatedTotalsByBoq,
    matrixDisciplineFilter,
    matrixStatusFilter,
    matrixSearch,
    sortField,
    sortAsc,
  ]);

  /* ── KPI Summary Cards ── */
  const kpiStats = useMemo(() => {
    const totalLinks = links.length;
    const totalAllocatedQty = links.reduce((sum, l) => sum + (Number(l.planned_qty) || 0), 0);
    let balancedCount = 0;
    let overCount = 0;
    let partialCount = 0;

    boqRows.forEach((b) => {
      const allocated = allocatedTotalsByBoq.get(b.id) || 0;
      const contract = Number(b.contract_qty) || 0;
      if (allocated === 0) return;
      if (contract > 0 && allocated > contract + 1e-4) {
        overCount++;
      } else if (contract > 0 && Math.abs(allocated - contract) < 1e-4) {
        balancedCount++;
      } else {
        partialCount++;
      }
    });

    return {
      totalLinks,
      totalAllocatedQty: Math.round(totalAllocatedQty * 100) / 100,
      balancedCount,
      overCount,
      partialCount,
    };
  }, [links, boqRows, allocatedTotalsByBoq]);

  /* Render tree node recursively */
  const renderNode = (node: TreeNode): React.ReactNode => {
    const isOpen = expanded.has(node.key);
    const state = nodeCheckedState(node);
    const hasKids = !!(node.children?.length || node.acts?.length);

    return (
      <div key={node.key}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer ${
            node.depth === 0 ? 'bg-slate-50/80 dark:bg-slate-950/40 font-bold' : ''
          }`}
          style={{ paddingInlineStart: `${8 + node.depth * 18}px` }}
          onClick={() => hasKids && toggleExpand(node.key)}
        >
          {hasKids ? (
            isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )
          ) : (
            <span className="w-3.5 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            role="checkbox"
            aria-checked={state === 'all' ? 'true' : state === 'some' ? 'mixed' : 'false'}
            aria-label={isAr ? `تحديد كافة الأنشطة تحت ${node.label}` : `Select all activities under ${node.label}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCheckIds(idsUnder(node));
            }}
            className="shrink-0 cursor-pointer"
            title={isAr ? 'تحديد الكل تحت هذا الفرع' : 'Select all under this branch'}
          >
            {state === 'all' ? (
              <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            ) : state === 'some' ? (
              <span className="w-4 h-4 rounded-[3px] border-2 border-emerald-700 bg-emerald-700 relative inline-block">
                <span className="absolute inset-x-0.5 top-1/2 -translate-y-1/2 h-0.5 bg-white dark:bg-slate-900" />
              </span>
            ) : (
              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            )}
          </button>
          {node.depth === 0 ? (
            <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
          )}
          <span
            className={`text-[11px] truncate flex-1 ${
              node.depth === 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {node.label}
          </span>
          <span className="text-[9px] text-slate-400 tabular-nums shrink-0">{node.count}</span>
        </div>

        {isOpen && node.children?.map(renderNode)}
        {isOpen &&
          node.acts?.map((a) => {
            const isSel = checked.has(a.id);
            const linkCount = links.filter((l) => l.activity_id === a.id).length;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-1.5 px-2 py-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer ${
                  isSel ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''
                }`}
                style={{ paddingInlineStart: `${8 + (node.depth + 1) * 18 + 4}px` }}
                onClick={() => toggleCheckIds([a.id])}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSel}
                  aria-label={isAr ? `تحديد النشاط ${a.name_ar}` : `Select activity ${a.name_ar}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCheckIds([a.id]);
                  }}
                  className="shrink-0 cursor-pointer"
                >
                  {isSel ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </button>
                <span className="font-mono text-[9px] text-slate-400 w-16 shrink-0 truncate">{a.code || '—'}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate flex-1">{a.name_ar}</span>
                {a.is_critical && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                    title={isAr ? 'مسار حرج' : 'Critical Path'}
                  />
                )}
                {linkCount > 0 && (
                  <span className="shrink-0 px-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black tabular-nums">
                    {linkCount} {linkCount === 1 ? (isAr ? 'بند' : 'item') : isAr ? 'بنود' : 'items'}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div
      className={`p-4 md:p-6 space-y-5 max-w-7xl mx-auto ${isAr ? 'text-end' : 'text-start'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Split className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'مصفوفة وتوزيع الأنشطة على بنود الكميات' : 'Quantity & Activity Allocation Matrix'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'مصفوفة توزيع الكميات، التحقق من توازن رصيد المقايسة، والربط الجماعي الهيكلي'
                : 'Quantity allocation matrix, balance validation indicators, and bulk activity assignment'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => selectedProjectId && loadAll(selectedProjectId)}
            disabled={loading || !selectedProjectId}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
            title={isAr ? 'تحديث البيانات' : 'Refresh data'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* View mode switcher */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'matrix' || !canEdit
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مصفوفة التوزيع' : 'Allocation Matrix'}</span>
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'الهيكل والربط الجماعي' : 'Tree & Bulk Link'}</span>
              </button>
            )}
          </div>

          {/* Project selector with two-way sync */}
          <div className="relative">
            <label htmlFor="allocation-project-select" className="sr-only">
              {isAr ? 'اختر المشروع النشط' : 'Select active project'}
            </label>
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute start-3 pointer-events-none" aria-hidden="true" />
              <select
                id="allocation-project-select"
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="ps-9 pe-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer min-w-[230px] shadow-xs"
              >
                <option value="">{isAr ? '— اختر المشروع —' : '— Select Project —'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-16 text-center space-y-3 bg-white/40 dark:bg-slate-900/40">
          <TreePine className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'اختر مشروعاً للبدء' : 'Select a Project to Start'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'قم باختيار المشروع من القائمة أعلاه لعرض مصفوفة توزيع الكميات المعتمدة والأنشطة والتحقق من التوازن الحسابي.'
              : 'Select a project from the dropdown above to view the quantity allocation matrix, activities, and balance verification.'}
          </p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-400">
            {isAr
              ? 'جاري تحميل بيانات الأنشطة وبنود المقايسة وروابط التوزيع…'
              : 'Loading activities, BOQ items, and allocation links…'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── KPI Summary Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isAr ? 'إجمالي الروابط النشطة' : 'Total Active Links'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{kpiStats.totalLinks}</span>
                <Link2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isAr ? 'إجمالي الكميات الموزعة' : 'Total Allocated Qty'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums font-mono">
                  {kpiStats.totalAllocatedQty.toLocaleString()}
                </span>
                <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                {isAr ? 'بنود متوازنة بنسبة 100%' : '100% Balanced Items'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {kpiStats.balancedCount}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                {isAr ? 'بنود توزيع جزئي' : 'Partially Allocated Items'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {kpiStats.partialCount}
                </span>
                <Scale className="w-4 h-4 text-amber-500" aria-hidden="true" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              <span className="text-[10px] text-rose-500 font-bold block">
                {isAr ? 'تنبيهات تجاوز الكمية' : 'Over-allocation Warnings'}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-black text-rose-500 tabular-nums">{kpiStats.overCount}</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              VIEW 1: ALLOCATION MATRIX TABLE
             ════════════════════════════════════════════════════════════════ */}
          {(viewMode === 'matrix' || !canEdit) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Matrix Table Filters Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'جدول مصفوفة توزيع الكميات المباشر' : 'Live Quantity Allocation Matrix Table'}
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">
                      {matrixRows.length} {isAr ? 'صف معروض' : 'rows shown'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="hidden sm:inline">
                      {isAr
                        ? 'إمكانية التمرير الأفقي عند صغر الشاشة'
                        : 'Horizontal scroll enabled for smaller screens'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search input with clear button */}
                  <div className="relative flex-1 min-w-[200px]">
                    <label htmlFor="matrix-search-input" className="sr-only">
                      {isAr ? 'بحث في مصفوفة التوزيع' : 'Search in allocation matrix'}
                    </label>
                    <Search
                      className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="matrix-search-input"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder={
                        isAr
                          ? 'بحث باسم النشاط، كود المقايسة، أو كود التكلفة…'
                          : 'Search by activity name, item code, or cost code…'
                      }
                      className="w-full ps-9 pe-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {matrixSearch && (
                      <button
                        type="button"
                        onClick={() => setMatrixSearch('')}
                        aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                        className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Discipline filter */}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="matrix-discipline-select" className="sr-only">
                      {isAr ? 'تصفية التخصص' : 'Filter by discipline'}
                    </label>
                    <select
                      id="matrix-discipline-select"
                      value={matrixDisciplineFilter}
                      onChange={(e) => setMatrixDisciplineFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">{isAr ? 'كافة التخصصات' : 'All Disciplines'}</option>
                      {allDisciplines.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="matrix-status-select" className="sr-only">
                      {isAr ? 'تصفية حالة التوازن' : 'Filter by balance status'}
                    </label>
                    <select
                      id="matrix-status-select"
                      value={matrixStatusFilter}
                      onChange={(e) => setMatrixStatusFilter(e.target.value as typeof matrixStatusFilter)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">{isAr ? 'كافة حالات التوازن' : 'All Balance States'}</option>
                      <option value="balanced">{isAr ? 'متوازن بالكامل (100%)' : 'Fully Balanced (100%)'}</option>
                      <option value="partial">{isAr ? 'توزيع جزئي (متبقي رصيد)' : 'Partial Allocation (Remaining)'}</option>
                      <option value="over">{isAr ? 'تجاوز المقايسة (فائض كمية)' : 'Over-allocated (Surplus)'}</option>
                    </select>
                  </div>

                  {(matrixSearch || matrixDisciplineFilter !== 'all' || matrixStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMatrixSearch('');
                        setMatrixDisciplineFilter('all');
                        setMatrixStatusFilter('all');
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 px-2 py-1 cursor-pointer transition"
                    >
                      {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Responsive Table Container with Horizontal Scrolling ── */}
              <div
                className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
                role="region"
                aria-label={isAr ? 'جدول مصفوفة توزيع الكميات على الأنشطة' : 'Activity Quantity Allocation Matrix Table'}
                tabIndex={0}
              >
                <table className="w-full min-w-[980px] border-collapse text-xs">
                  <caption className="sr-only">
                    {isAr
                      ? 'مصفوفة توزيع بنود المقايسة ومواردها على أنشطة الجدول الزمني مع رصيد الكميات ونسب التوزيع'
                      : 'Schedule activity to BOQ item allocation matrix table'}
                  </caption>
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 select-none">
                    <tr>
                      <th
                        scope="col"
                        id="col-act"
                        onClick={() => handleSort('act')}
                        className="px-3.5 py-3 text-start cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? 'نشاط الجدول الزمني' : 'Schedule Activity'}</span>
                          {sortField === 'act' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-disc"
                        onClick={() => handleSort('disc')}
                        className="px-3 py-3 text-start cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? 'التخصص / المنشأ' : 'Discipline / Structure'}</span>
                          {sortField === 'disc' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-boq"
                        onClick={() => handleSort('boq')}
                        className="px-3.5 py-3 text-start cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{isAr ? 'بند المقايسة المعتمد' : 'BOQ Item'}</span>
                          {sortField === 'boq' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-unit"
                        onClick={() => handleSort('unit')}
                        className="px-2 py-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{isAr ? 'الوحدة' : 'Unit'}</span>
                          {sortField === 'unit' && (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-contract"
                        onClick={() => handleSort('contract')}
                        className="px-3 py-3 text-end cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{isAr ? 'كمية العقد' : 'Contract Qty'}</span>
                          {sortField === 'contract' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-allocated"
                        onClick={() => handleSort('allocated')}
                        className="px-3 py-3 text-end min-w-[140px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{isAr ? 'الكمية الموزعة للنشاط' : 'Allocated Qty'}</span>
                          {sortField === 'allocated' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-pct"
                        onClick={() => handleSort('pct')}
                        className="px-3 py-3 text-center min-w-[130px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{isAr ? 'نسبة التوزيع %' : 'Allocation %'}</span>
                          {sortField === 'pct' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-balance"
                        onClick={() => handleSort('balance')}
                        className="px-3 py-3 text-end cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{isAr ? 'رصيد المقايسة' : 'BOQ Balance'}</span>
                          {sortField === 'balance' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      <th
                        scope="col"
                        id="col-status"
                        onClick={() => handleSort('status')}
                        className="px-3 py-3 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{isAr ? 'حالة التوازن' : 'Balance Status'}</span>
                          {sortField === 'status' ? (
                            sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                          )}
                        </div>
                      </th>

                      {canEdit && (
                        <th scope="col" id="col-actions" className="px-3 py-3 text-center">
                          {isAr ? 'الإجراءات' : 'Actions'}
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matrixRows.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 10 : 9} className="py-14 text-center text-xs text-slate-400 leading-relaxed">
                          {links.length === 0
                            ? isAr
                              ? 'لا توجد روابط توزيع مسجلة بعد — انتقل إلى تبويب "الهيكل والربط الجماعي" لربط الأنشطة ببنود المقايسة'
                              : 'No allocation links recorded yet — switch to the "Tree & Bulk Link" tab to link activities to BOQ items'
                            : isAr
                            ? 'لا توجد نتائج مطابقة لشروط البحث والتصفية'
                            : 'No results matching search and filter criteria'}
                        </td>
                      </tr>
                    ) : (
                      matrixRows.map((row) => {
                        const {
                          link,
                          act,
                          boq,
                          contractQty,
                          remainingBalance,
                          allocPct,
                          linkSharePct,
                          balanceStatus,
                        } = row;
                        const isEditing = editingLinkId === link.id;
                        const isSaving = savingLinkId === link.id;

                        return (
                          <tr
                            key={link.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                              balanceStatus === 'over'
                                ? 'bg-rose-50/30 dark:bg-rose-950/20'
                                : balanceStatus === 'balanced'
                                ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                                : ''
                            }`}
                          >
                            {/* Activity Column */}
                            <td headers="col-act" className="px-3.5 py-2.5">
                              <div
                                className="font-bold text-slate-800 dark:text-slate-100 max-w-[220px] truncate"
                                title={act?.name_ar || ''}
                              >
                                {act?.name_ar}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{act?.code || '—'}</span>
                                {act?.is_critical && (
                                  <span className="px-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[8px] font-bold">
                                    {isAr ? 'حرج' : 'Critical'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Discipline & Structure */}
                            <td headers="col-disc" className="px-3 py-2.5">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {act?.discipline}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                {act?.structure}
                              </div>
                            </td>

                            {/* BOQ Item Column */}
                            <td headers="col-boq" className="px-3.5 py-2.5">
                              <div
                                className="font-bold text-slate-800 dark:text-slate-100 max-w-[220px] truncate"
                                title={boq?.description_ar || ''}
                              >
                                {boq?.description_ar}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>{boq?.item_code}</span>
                                {boq?.group_tag && (
                                  <span className="px-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[8px]">
                                    {boq.group_tag}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Unit */}
                            <td headers="col-unit" className="px-2 py-2.5 text-center font-bold text-slate-500 dark:text-slate-400">
                              {boq?.unit || '—'}
                            </td>

                            {/* Contract Qty */}
                            <td
                              headers="col-contract"
                              className="px-3 py-2.5 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300 font-bold"
                            >
                              {contractQty.toLocaleString()}
                            </td>

                            {/* Allocated Qty with inline editable numeric input */}
                            <td headers="col-allocated" className="px-3 py-2.5 text-end">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <label htmlFor={`edit-qty-${link.id}`} className="sr-only">
                                    {isAr
                                      ? `تعديل الكمية الموزعة لنشاط ${act?.name_ar}`
                                      : `Edit allocated quantity for ${act?.name_ar}`}
                                  </label>
                                  <input
                                    id={`edit-qty-${link.id}`}
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editingQty}
                                    onChange={(e) => setEditingQty(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditLink(link.id);
                                      if (e.key === 'Escape') cancelEditLink();
                                    }}
                                    dir="ltr"
                                    className="w-20 px-2 py-1 rounded-lg border border-emerald-500 text-xs font-mono font-bold tabular-nums outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => saveEditLink(link.id)}
                                    disabled={isSaving}
                                    aria-label={isAr ? 'حفظ الكمية المعدلة' : 'Save modified quantity'}
                                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditLink}
                                    aria-label={isAr ? 'إلغاء التعديل' : 'Cancel edit'}
                                    className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 group">
                                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                    {(link.planned_qty ?? 0).toLocaleString()}
                                  </span>
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => startEditLink(link)}
                                      aria-label={isAr ? `تعديل كمية ${act?.name_ar}` : `Edit quantity for ${act?.name_ar}`}
                                      title={isAr ? 'تعديل الكمية' : 'Edit quantity'}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Percentage Allocation Indicator */}
                            <td headers="col-pct" className="px-3 py-2.5">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-between w-full text-[10px] tabular-nums font-bold">
                                  <span className="text-slate-400 dark:text-slate-500">{isAr ? 'حصة النشاط:' : 'Activity Share:'}</span>
                                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                                    {linkSharePct.toFixed(1)}%
                                  </span>
                                </div>
                                <div
                                  className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden"
                                  role="progressbar"
                                  aria-valuenow={Math.min(100, Math.round(allocPct))}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={
                                    isAr
                                      ? `نسبة التوزيع الإجمالية لبند المقايسة ${allocPct.toFixed(1)}%`
                                      : `Total allocation percentage for BOQ item ${allocPct.toFixed(1)}%`
                                  }
                                >
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      balanceStatus === 'over'
                                        ? 'bg-rose-500'
                                        : balanceStatus === 'balanced'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, allocPct)}%` }}
                                  />
                                </div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 tabular-nums">
                                  {isAr ? 'إجمالي البند:' : 'Total Item:'} {allocPct.toFixed(1)}%
                                </div>
                              </div>
                            </td>

                            {/* Remaining Balance Indicator */}
                            <td headers="col-balance" className="px-3 py-2.5 text-end font-mono tabular-nums">
                              {remainingBalance < 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                  {isAr ? 'فائض' : 'Surplus'} {Math.abs(remainingBalance).toLocaleString()}
                                </span>
                              ) : remainingBalance === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">0</span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-300">
                                  {remainingBalance.toLocaleString()}
                                </span>
                              )}
                            </td>

                            {/* Balance Status Badge */}
                            <td headers="col-status" className="px-3 py-2.5 text-center">
                              {balanceStatus === 'balanced' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  <Check className="w-3 h-3" />
                                  <span>{isAr ? 'متوازن' : 'Balanced'}</span>
                                </span>
                              ) : balanceStatus === 'over' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{isAr ? 'تجاوز' : 'Over'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                  <Scale className="w-3 h-3" />
                                  <span>{isAr ? 'توزيع جزئي' : 'Partial'}</span>
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            {canEdit && (
                              <td headers="col-actions" className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => doUnlink(link.id)}
                                  aria-label={
                                    isAr
                                      ? `فك ربط النشاط ${act?.name_ar} من بند ${boq?.description_ar}`
                                      : `Unlink activity ${act?.name_ar} from BOQ item ${boq?.description_ar}`
                                  }
                                  title={isAr ? 'فك الربط' : 'Unlink'}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              VIEW 2: HIERARCHICAL TREE & BULK LINKING
             ════════════════════════════════════════════════════════════════ */}
          {viewMode === 'tree' && canEdit && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* ── LEFT: activities tree (3 cols) ── */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                      {projectLabel || (isAr ? 'أنشطة المشروع' : 'Project Activities')}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={expandAll}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
                      >
                        {isAr ? 'توسيع الكل' : 'Expand All'}
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={collapseAll}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {isAr ? 'طي الكل' : 'Collapse All'}
                      </button>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {filteredActs.length} {isAr ? 'نشاط' : 'activities'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[140px]">
                      <label htmlFor="tree-search-input" className="sr-only">
                        {isAr ? 'بحث في أنشطة الشجرة' : 'Search tree activities'}
                      </label>
                      <Search
                        className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="tree-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isAr ? 'بحث في الأنشطة…' : 'Search activities…'}
                        className="w-full ps-8 pe-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[11px] outline-none focus:border-emerald-500"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                          className="absolute end-2 top-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <MultiSelect
                      label={isAr ? 'التخصص' : 'Discipline'}
                      options={allDisciplines}
                      selected={discFilter}
                      onChange={setDiscFilter}
                      isAr={isAr}
                    />
                    <MultiSelect
                      label={isAr ? 'المنشأ' : 'Structure'}
                      options={allStructures}
                      selected={structFilter}
                      onChange={setStructFilter}
                      isAr={isAr}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[520px]">
                  {filteredActs.length === 0 ? (
                    <div className="py-14 text-center text-xs text-slate-400 px-6 leading-relaxed">
                      {isAr
                        ? 'لا توجد أنشطة مطابقة — يرجى استيراد الجدول الزمني من صفحة خط الأساس أولاً'
                        : 'No matching activities — please import schedule from the Baseline page first'}
                    </div>
                  ) : (
                    <>
                      {/* Root: Project Header with Select All */}
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-950/50">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked.size > 0 && checked.size === filteredActs.length}
                          aria-label={isAr ? 'تحديد كافة أنشطة المشروع المعروضة' : 'Select all displayed project activities'}
                          onClick={() => toggleCheckIds(filteredActs.map((a) => a.id))}
                          className="shrink-0 cursor-pointer"
                        >
                          {checked.size > 0 && checked.size === filteredActs.length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                          ) : checked.size > 0 ? (
                            <span className="w-4 h-4 rounded-[3px] border-2 border-emerald-700 bg-emerald-700 relative inline-block">
                              <span className="absolute inset-x-0.5 top-1/2 -translate-y-1/2 h-0.5 bg-white dark:bg-slate-900" />
                            </span>
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                        <TreePine className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                        <span className="text-xs font-black text-slate-800 dark:text-white flex-1">{projectLabel}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {filteredActs.length} {isAr ? 'نشاط' : 'activities'}
                        </span>
                      </div>
                      {tree.map(renderNode)}
                    </>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Target BOQ Item & Linking Panel (2 cols) ── */}
              <div className="lg:col-span-2 space-y-4">
                {/* Target BOQ Item Picker & Bulk Linking Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                      {isAr ? 'بند المقايسة المستهدف للربط' : 'Target BOQ Item for Allocation'}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
                        checked.size > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {checked.size} {isAr ? 'نشاط محدد' : 'activities selected'}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-3">
                    {/* BOQ Search input with clear button */}
                    <div className="relative">
                      <label htmlFor="boq-items-search-input" className="sr-only">
                        {isAr ? 'بحث في جدول بنود الكميات' : 'Search BOQ items table'}
                      </label>
                      <Search
                        className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="boq-items-search-input"
                        value={boqSearch}
                        onChange={(e) => setBoqSearch(e.target.value)}
                        placeholder={
                          isAr
                            ? 'ابحث عن بند المقايسة بالكود أو الوصف…'
                            : 'Search BOQ item by code or description…'
                        }
                        className="w-full ps-8 pe-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[11px] outline-none focus:border-emerald-500"
                      />
                      {boqSearch && (
                        <button
                          type="button"
                          onClick={() => setBoqSearch('')}
                          aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                          className="absolute end-2 top-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div
                      role="listbox"
                      aria-label={isAr ? 'قائمة بنود المقايسة المتاحة' : 'Available BOQ items list'}
                      className="overflow-y-auto max-h-[220px] divide-y divide-slate-50 dark:divide-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl"
                    >
                      {filteredBoq.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-slate-400">
                          {isAr
                            ? 'لا توجد بنود — يرجى استيرادها من صفحة جدول الكميات'
                            : 'No items found — please import them from the BOQ page'}
                        </div>
                      ) : (
                        filteredBoq.slice(0, 300).map((b) => {
                          const isTarget = targetBoq?.id === b.id;
                          const bAllocated = allocatedTotalsByBoq.get(b.id) || 0;
                          const bContract = Number(b.contract_qty) || 0;
                          const bPct = bContract > 0 ? (bAllocated / bContract) * 100 : 0;

                          return (
                            <button
                              key={b.id}
                              type="button"
                              role="option"
                              aria-selected={isTarget}
                              onClick={() => {
                                setTargetBoq(b);
                                if (!bulkQty) {
                                  const rem = Math.max(0, bContract - bAllocated);
                                  const perAct = checked.size > 0 ? rem / checked.size : rem;
                                  setBulkQty(String(Math.round(perAct * 100) / 100));
                                }
                              }}
                              className={`w-full text-start px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                                isTarget ? 'bg-emerald-50 dark:bg-emerald-950/30 border-s-4 border-emerald-500' : ''
                              }`}
                            >
                              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                {b.description_ar}
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-1">
                                <span className="font-mono">{b.item_code}</span>
                                {b.group_tag && (
                                  <span className="px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    {b.group_tag}
                                  </span>
                                )}
                                <span>
                                  {isAr ? 'عقد:' : 'Contract:'} {bContract} {b.unit}
                                </span>
                                <span
                                  className={`tabular-nums font-bold ${
                                    bPct > 100 ? 'text-rose-500 dark:text-rose-400' : bPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  ({bPct.toFixed(0)}% {isAr ? 'موزع' : 'allocated'})
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Total Balance Validation Card & Numeric Input */}
                    {targetBoq && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {isAr ? 'توازن رصيد البند المختار:' : 'Selected Item Balance:'}
                          </span>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                            {targetCurrentAllocated} / {targetContractQty} {targetBoq.unit}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div
                          className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.round(targetAllocPct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={
                            isAr
                              ? `توزيع بند المقايسة الحالي ${targetAllocPct.toFixed(1)}%`
                              : `Current BOQ item allocation ${targetAllocPct.toFixed(1)}%`
                          }
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              targetAllocPct >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, targetAllocPct)}%` }}
                          />
                        </div>

                        {/* Numeric input with label and helper buttons */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <label
                              htmlFor="bulk-allocation-qty"
                              className="font-bold text-slate-600 dark:text-slate-300"
                            >
                              {isAr
                                ? `الكمية الموزعة لكل نشاط (${targetBoq.unit}):`
                                : `Allocated Qty per activity (${targetBoq.unit}):`}
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {isAr ? 'رصيد متبقي:' : 'Remaining balance:'}{' '}
                              <strong className="font-mono text-emerald-600">{targetRemainingQty}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              id="bulk-allocation-qty"
                              type="number"
                              step="any"
                              min="0"
                              value={bulkQty}
                              onChange={(e) => setBulkQty(e.target.value)}
                              dir="ltr"
                              placeholder="0.00"
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold tabular-nums outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => setQuickAllocation(1.0)}
                              disabled={checked.size === 0 || targetRemainingQty <= 0}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 disabled:opacity-40 cursor-pointer transition"
                            >
                              {isAr ? 'المتبقي بالتساوي' : 'Remainder evenly'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickAllocation(0.5)}
                              disabled={checked.size === 0 || targetRemainingQty <= 0}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 disabled:opacity-40 cursor-pointer transition"
                            >
                              50%
                            </button>
                          </div>
                        </div>

                        {/* Balance Validation Simulation Status */}
                        {checked.size > 0 && Number(bulkQty) > 0 && (
                          <div
                            className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
                              bulkIsOverCapacity
                                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                                : bulkIsFullyBalanced
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {bulkIsOverCapacity ? (
                              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            ) : bulkIsFullyBalanced ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                            )}
                            <div>
                              <div className="font-bold">
                                {bulkIsOverCapacity
                                  ? isAr
                                    ? 'تنبيه: التوزيع المقترح يتجاوز كمية العقد'
                                    : 'Warning: Proposed allocation exceeds contract quantity'
                                  : bulkIsFullyBalanced
                                  ? isAr
                                    ? 'توزيع متوازن ومكتمل 100%'
                                    : '100% Fully Balanced Allocation'
                                  : isAr
                                  ? 'توزيع جزئي ضمن رصيد المقايسة'
                                  : 'Partial allocation within BOQ balance'}
                              </div>
                              <div className="text-[10px] mt-0.5 opacity-90 tabular-nums">
                                {isAr ? 'الإجمالي بعد الربط:' : 'Total after linking:'}{' '}
                                <strong className="font-mono">{bulkSimulatedTotal}</strong>{' '}
                                {isAr ? 'من أصل' : 'out of'} {targetContractQty} {targetBoq.unit}
                                {bulkIsOverCapacity &&
                                  ` (${isAr ? 'فائض تجاوز:' : 'Surplus excess:'} ${(
                                    bulkSimulatedTotal - targetContractQty
                                  ).toFixed(2)})`}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={doBulkLink}
                          disabled={busy || !checked.size || Number(bulkQty) <= 0}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/20 transition"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                          {isAr
                            ? `ربط ${checked.size || ''} نشاطاً ببند المقايسة`
                            : `Link ${checked.size || ''} activities to BOQ item`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Links Mini-Table with responsive scrolling */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                      {isAr ? 'الروابط الحالية' : 'Current Links'}
                    </h2>
                    <span className="text-[10px] text-slate-400 tabular-nums font-bold">
                      {links.length} {isAr ? 'رابط' : 'links'}
                    </span>
                  </div>

                  <div
                    className="overflow-x-auto overflow-y-auto max-h-[220px] scrollbar-thin"
                    role="region"
                    aria-label={isAr ? 'قائمة الروابط الحالية' : 'Current links list'}
                    tabIndex={0}
                  >
                    <table className="w-full min-w-[340px] border-collapse text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold sticky top-0">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-start">
                            {isAr ? 'النشاط' : 'Activity'}
                          </th>
                          <th scope="col" className="px-2 py-2 text-start">
                            {isAr ? 'بند المقايسة' : 'BOQ Item'}
                          </th>
                          <th scope="col" className="px-2 py-2 text-end">
                            {isAr ? 'الكمية' : 'Quantity'}
                          </th>
                          <th scope="col" className="px-2 py-2 text-center">
                            {isAr ? 'إجراء' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                        {links.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                              {isAr ? 'لا توجد روابط توزيع مسجلة بعد' : 'No allocation links recorded yet'}
                            </td>
                          </tr>
                        ) : (
                          links.map((l) => {
                            const a = actsMap.get(l.activity_id);
                            const b = boqMap.get(l.boq_item_id);
                            return (
                              <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td
                                  className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate"
                                  title={a?.name_ar || ''}
                                >
                                  {a?.name_ar || '—'}
                                </td>
                                <td
                                  className="px-2 py-1.5 text-slate-500 dark:text-slate-400 max-w-[120px] truncate"
                                  title={b?.description_ar || ''}
                                >
                                  {b?.description_ar || '—'}
                                </td>
                                <td className="px-2 py-1.5 text-end font-mono tabular-nums text-slate-700 dark:text-slate-300 font-bold">
                                  {l.planned_qty ?? 0}
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => doUnlink(l.id)}
                                    aria-label={
                                      isAr
                                        ? `فك ربط النشاط ${a?.name_ar || ''}`
                                        : `Unlink activity ${a?.name_ar || ''}`
                                    }
                                    className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer transition"
                                    title={isAr ? 'فك الربط' : 'Unlink'}
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
