'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  RotateCcw, 
  Boxes, 
  X,
  LayoutGrid,
  List as ListIcon,
  TableProperties,
  Flag,
  Calendar,
  User,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Deliverable, DeliverableStatus, DeliverableKind } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { DeliverableCard } from './DeliverableCard';
import { DeliverableDetailDrawer } from './DeliverableDetailDrawer';
import { DeliverableBlockerModal } from './DeliverableBlockerModal';
import { 
  getDeliverableMilestone, 
  getDeliverableClientDeadline, 
  encodeMilestoneInNotes 
} from '@/lib/planning/deliverable-helpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

interface DeliverablesKanbanBoardProps {
  projectId: string;
  projectName?: string;
  onOpenNewPackage?: () => void;
}

type SortField = 'ref_code' | 'title_ar' | 'priority' | 'status' | 'due_date' | 'client_deadline' | 'received_at';
type SortDirection = 'asc' | 'desc';

export const DeliverablesKanbanBoard: React.FC<DeliverablesKanbanBoardProps> = ({
  projectId,
  projectName,
  onOpenNewPackage,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');

  // View Mode: Kanban vs List
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // List sorting
  const [sortField, setSortField] = useState<SortField>('received_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Drag and Drop state
  const [draggedDeliverableId, setDraggedDeliverableId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DeliverableStatus | null>(null);

  // Accessible live status announcement
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    // Clear after 4 seconds
    setTimeout(() => {
      setAnnouncement((prev) => (prev === msg ? '' : prev));
    }, 4000);
  }, []);

  // Selected deliverable for Detail Drawer
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);

  // Blocker modal state
  const [blockingDeliverable, setBlockingDeliverable] = useState<Deliverable | null>(null);

  // New Package Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Deliverable> & { milestone_tag?: string }>({
    ref_code: '',
    title_ar: '',
    kind: 'E1',
    priority: 'normal',
    received_from: 'technical_office',
    received_at: new Date().toISOString().slice(0, 10),
    due_date: '',
    client_review_deadline: '',
    milestone_tag: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchDeliverables = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await DeliverablesService.getDeliverables(projectId);
      setDeliverables(data);
      announce(isAr ? `تم تحديث قائمة التسليمات (${data.length} حزمة)` : `Deliverables updated (${data.length} packages)`);
    } catch (err) {
      logger.error('Failed to load deliverables', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, [projectId]);

  // Extract all distinct milestones from current deliverables
  const availableMilestones = useMemo(() => {
    const set = new Set<string>();
    for (const d of deliverables) {
      const m = getDeliverableMilestone(d);
      if (m) set.add(m);
    }
    return Array.from(set).sort();
  }, [deliverables]);

  // Column definitions for Kanban
  const columns = useMemo(() => [
    {
      status: 'received' as DeliverableStatus,
      title: isAr ? 'مستلمة' : 'Received',
      description: isAr ? 'حزم جديدة مستلمة من المكتب الفني' : 'New packages received from technical office',
      headerBg: 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700',
      badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
      icon: Boxes,
    },
    {
      status: 'in_progress' as DeliverableStatus,
      title: isAr ? 'قيد العمل' : 'In Progress',
      description: isAr ? 'دراسة وإعداد المخططات التنفيذية' : 'Studying and preparing shop drawings',
      headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
      icon: Clock,
    },
    {
      status: 'blocked' as DeliverableStatus,
      title: isAr ? 'متعطلة' : 'Blocked',
      description: isAr ? 'يوجد مانع أو بانتظار استفسار فني' : 'Blocked or awaiting technical clarification',
      headerBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
      icon: ShieldAlert,
    },
    {
      status: 'ready_to_return' as DeliverableStatus,
      title: isAr ? 'جاهزة للإعادة' : 'Ready to Return',
      description: isAr ? 'اكتملت وجاهزة للتسليم للمكتب الفني' : 'Completed and ready for technical office return',
      headerBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      icon: RotateCcw,
    },
    {
      status: 'returned' as DeliverableStatus,
      title: isAr ? 'تمت الإعادة والاستلام' : 'Returned',
      description: isAr ? 'مغلقة ومسلمة للمكتب الفني رسمياً' : 'Closed and officially returned to technical office',
      headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      icon: CheckCircle2,
    },
  ], [isAr]);

  // Filtered deliverables
  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      if (selectedKind !== 'all' && d.kind !== selectedKind) return false;
      if (selectedPriority !== 'all' && d.priority !== selectedPriority) return false;
      
      // Milestone filter
      if (selectedMilestone !== 'all') {
        const m = getDeliverableMilestone(d);
        if (m !== selectedMilestone) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = d.ref_code.toLowerCase().includes(q);
        const matchTitle = d.title_ar.toLowerCase().includes(q);
        const matchHolder = d.current_holder?.name_ar?.toLowerCase().includes(q) || false;
        const matchMilestone = getDeliverableMilestone(d)?.toLowerCase().includes(q) || false;
        if (!matchRef && !matchTitle && !matchHolder && !matchMilestone) return false;
      }
      return true;
    });
  }, [deliverables, selectedKind, selectedPriority, selectedMilestone, searchQuery]);

  // Sorted deliverables for List View
  const sortedDeliverables = useMemo(() => {
    const list = [...filteredDeliverables];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'ref_code':
          valA = a.ref_code;
          valB = b.ref_code;
          break;
        case 'title_ar':
          valA = a.title_ar;
          valB = b.title_ar;
          break;
        case 'priority':
          const priorityWeights = { high: 3, normal: 2, low: 1 };
          valA = priorityWeights[a.priority] || 0;
          valB = priorityWeights[b.priority] || 0;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'client_deadline':
          const deadA = getDeliverableClientDeadline(a).deadline || '9999-99-99';
          const deadB = getDeliverableClientDeadline(b).deadline || '9999-99-99';
          valA = deadA;
          valB = deadB;
          break;
        case 'due_date':
          valA = a.due_date || '9999-99-99';
          valB = b.due_date || '9999-99-99';
          break;
        case 'received_at':
        default:
          valA = a.received_at || '';
          valB = b.received_at || '';
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDeliverables, sortField, sortDirection]);

  // Group by status for Kanban
  const groupedDeliverables = useMemo(() => {
    const map: Record<DeliverableStatus, Deliverable[]> = {
      received: [],
      in_progress: [],
      blocked: [],
      ready_to_return: [],
      returned: [],
      approved: [],
      rejected: [],
    };
    for (const d of filteredDeliverables) {
      if (map[d.status]) {
        map[d.status].push(d);
      } else {
        map.received.push(d);
      }
    }
    return map;
  }, [filteredDeliverables]);

  // Status transition handler
  const handleMoveStatus = async (id: string, newStatus: DeliverableStatus, reason?: string) => {
    try {
      const targetDeliv = deliverables.find((d) => d.id === id);
      const updated = await DeliverablesService.updateDeliverableStatus(
        id,
        projectId,
        newStatus,
        reason
      );
      if (updated) {
        setDeliverables((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus, blocked_reason: reason } : d))
        );
        const colTitle = columns.find((c) => c.status === newStatus)?.title || newStatus;
        announce(
          isAr
            ? `تم نقل الحزمة ${targetDeliv?.ref_code || id} إلى حالة: ${colTitle}`
            : `Moved package ${targetDeliv?.ref_code || id} to ${colTitle}`
        );
      }
    } catch (err) {
      logger.error('Failed to move deliverable status', { detail: err });
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, delivId: string) => {
    e.dataTransfer.setData('text/plain', delivId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDeliverableId(delivId);
  };

  const handleDragEnd = () => {
    setDraggedDeliverableId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent<HTMLElement>, status: DeliverableStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent<HTMLElement>, status: DeliverableStatus) => {
    // Only clear if leaving the column itself, not entering a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent<HTMLElement>, status: DeliverableStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedDeliverableId;
    if (id) {
      const targetDeliv = deliverables.find((d) => d.id === id);
      if (targetDeliv && targetDeliv.status !== status) {
        if (status === 'blocked') {
          // Open blocker modal if dropped onto blocked
          setBlockingDeliverable(targetDeliv);
        } else {
          handleMoveStatus(id, status);
        }
      }
    }
    setDragOverColumn(null);
    setDraggedDeliverableId(null);
  };

  // Toggle sort helper for List View
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Create new deliverable
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.ref_code?.trim() || !newForm.title_ar?.trim()) {
      setCreateError(isAr ? 'يرجى ملء الكود وعنوان الحزمة.' : 'Please enter code and package title.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      let finalNotes = newForm.notes || '';
      if (newForm.milestone_tag?.trim()) {
        finalNotes = encodeMilestoneInNotes(finalNotes, newForm.milestone_tag.trim());
      }

      const payload: Partial<Deliverable> = {
        ...newForm,
        project_id: projectId,
        status: 'received',
        notes: finalNotes,
        milestone_name: newForm.milestone_tag?.trim() || undefined,
        client_review_deadline: newForm.client_review_deadline || undefined,
      };

      const created = await DeliverablesService.saveDeliverable(payload);
      if (created) {
        // preserve milestone and deadline locally
        const enriched: Deliverable = {
          ...created,
          milestone_name: newForm.milestone_tag?.trim() || undefined,
          client_review_deadline: newForm.client_review_deadline || undefined,
        };
        setDeliverables((prev) => [enriched, ...prev]);
        setIsNewModalOpen(false);
        announce(
          isAr
            ? `تم استلام الحزمة الجديدة بنجاح: ${enriched.ref_code}`
            : `New package created: ${enriched.ref_code}`
        );
        setNewForm({
          ref_code: '',
          title_ar: '',
          kind: 'E1',
          priority: 'normal',
          received_from: 'technical_office',
          received_at: new Date().toISOString().slice(0, 10),
          due_date: '',
          client_review_deadline: '',
          milestone_tag: '',
          notes: '',
        });
      }
    } catch (err: unknown) {
      logger.error('Create package error', { detail: err });
      setCreateError((err as { message?: string } | null)?.message || (isAr ? 'فشل إنشاء الحزمة.' : 'Failed to create package.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Screen Reader Accessible Live Announcer */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Control Bar: Filters, View Toggle & Actions */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بالكود، العنوان، المعلم التعاقدي، أو المهندس...' : 'Search by code, title, milestone, engineer...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={isAr ? 'بحث في التسليمات' : 'Search deliverables'}
              className="w-full ps-10 pe-9 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Kind Filter */}
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            aria-label={isAr ? 'تصفية حسب نوع الحزمة' : 'Filter by kind'}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
          >
            <option value="all">{isAr ? 'كل الأنواع' : 'All Kinds'}</option>
            <option value="E1">{isAr ? 'مخططات تنفيذية (E1)' : 'Shop Drawings (E1)'}</option>
            <option value="E2">{isAr ? 'عينات واعتمادات مواد (E2)' : 'Material Samples (E2)'}</option>
            <option value="drawing_list">{isAr ? 'قوائم المخططات' : 'Drawing Lists'}</option>
            <option value="material_list">{isAr ? 'قوائم المواد' : 'Material Lists'}</option>
            <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label={isAr ? 'تصفية حسب الأولوية' : 'Filter by priority'}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
          >
            <option value="all">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
            <option value="high">{isAr ? 'عالية الأهمية' : 'High'}</option>
            <option value="normal">{isAr ? 'متوسطة' : 'Normal'}</option>
            <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
          </select>

          {/* Milestone Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMilestone}
              onChange={(e) => {
                setSelectedMilestone(e.target.value);
                announce(isAr ? `تصفية حسب المعلم: ${e.target.value}` : `Filtered by milestone: ${e.target.value}`);
              }}
              aria-label={isAr ? 'تصفية حسب المعلم التعاقدي' : 'Filter by milestone'}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
            >
              <option value="all">{isAr ? '🚩 كل المعالم التعاقدية' : '🚩 All Milestones'}</option>
              {availableMilestones.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDeliverables}
            disabled={loading}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title={isAr ? 'تحديث اللوحة' : 'Refresh board'}
            aria-label={isAr ? 'تحديث اللوحة' : 'Refresh board'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        {/* View Mode Toggle & Create Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Kanban / List Toggle */}
          <div 
            className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" 
            role="group" 
            aria-label={isAr ? 'نمط العرض' : 'View mode'}
          >
            <button
              type="button"
              onClick={() => {
                setViewMode('kanban');
                announce(isAr ? 'تم التبديل إلى عرض لوحة المهام' : 'Switched to Kanban View');
              }}
              aria-pressed={viewMode === 'kanban'}
              aria-label={isAr ? 'عرض لوحة المهام' : 'Kanban view'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isAr ? 'لوحة المهام' : 'Kanban'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                announce(isAr ? 'تم التبديل إلى عرض القائمة التفصيلية' : 'Switched to List View');
              }}
              aria-pressed={viewMode === 'list'}
              aria-label={isAr ? 'عرض القائمة التفصيلية' : 'List view'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{isAr ? 'قائمة تفصيلية' : 'List'}</span>
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={onOpenNewPackage || (() => setIsNewModalOpen(true))}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            aria-label={isAr ? 'استلام حزمة تسليمات جديدة' : 'Receive new package'}
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'استلام حزمة جديدة' : 'New Package'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const colItems = groupedDeliverables[col.status] || [];
            const Icon = col.icon;
            const isColumnOver = dragOverColumn === col.status;

            return (
              <section
                key={col.status}
                role="region"
                aria-label={`${col.title} - ${colItems.length} ${isAr ? 'حزم' : 'packages'}`}
                onDragOver={(e) => handleDragOverColumn(e, col.status)}
                onDragLeave={(e) => handleDragLeaveColumn(e, col.status)}
                onDrop={(e) => handleDropOnColumn(e, col.status)}
                className={`flex flex-col rounded-3xl border p-3.5 min-h-[550px] transition-all duration-200 ${
                  isColumnOver
                    ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01]'
                    : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                {/* Column Header */}
                <div 
                  className={`p-3 rounded-2xl border mb-3.5 flex items-center justify-between shadow-xs transition-colors select-none ${col.headerBg}`}
                  title={col.description}
                >
                  <div className="flex items-center gap-2 truncate">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                    <Icon className="w-4 h-4 shrink-0 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {col.title}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${col.badgeBg}`}>
                    {loading ? '...' : colItems.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3.5 flex-1">
                  {loading ? (
                    /* Skeletons while loading - prevents empty message flicker */
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map((k) => (
                        <div 
                          key={k} 
                          className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
                          </div>
                          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-7 w-full bg-slate-100 dark:bg-slate-700/40 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : colItems.length === 0 ? (
                    <div className="py-14 text-center text-[11px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1.5">
                      <Boxes className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                      <span>{isAr ? 'لا توجد تسليمات في هذه المرحلة' : 'No deliverables in this stage'}</span>
                    </div>
                  ) : (
                    colItems.map((deliv) => (
                      <DeliverableCard
                        key={deliv.id}
                        deliverable={deliv}
                        onSelect={(d) => setSelectedDeliverableId(d.id)}
                        onMoveStatus={handleMoveStatus}
                        onBlock={(d) => setBlockingDeliverable(d)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, deliv.id)}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedDeliverableId === deliv.id}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Rich List / Table View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold select-none">
                <tr>
                  <th 
                    className="p-3.5 text-start whitespace-nowrap cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                    onClick={() => handleSort('ref_code')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isAr ? 'الكود والنوع' : 'Code & Kind'}</span>
                      {sortField === 'ref_code' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 text-start cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                    onClick={() => handleSort('title_ar')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isAr ? 'عنوان الحزمة والمعلم التعاقدي' : 'Package Title & Milestone'}</span>
                      {sortField === 'title_ar' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 text-center whitespace-nowrap cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'حالة الاعتماد' : 'Status'}</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 text-center whitespace-nowrap cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                    onClick={() => handleSort('client_deadline')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'مهلة مراجعة الاستشاري' : 'Consultant Review SLA'}</span>
                      {sortField === 'client_deadline' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3.5 text-center whitespace-nowrap cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الأولوية' : 'Priority'}</span>
                      {sortField === 'priority' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-start whitespace-nowrap">
                    <span>{isAr ? 'المسؤول الحالي' : 'Current Assignee'}</span>
                  </th>
                  <th className="p-3.5 text-center whitespace-nowrap">
                    <span>{isAr ? 'البنود والمخططات' : 'Items & Drawings'}</span>
                  </th>
                  <th className="p-3.5 text-center whitespace-nowrap">
                    <span>{isAr ? 'الإجراءات' : 'Actions'}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {loading ? (
                  /* Skeleton Table Rows */
                  [1, 2, 3, 4, 5].map((k) => (
                    <tr key={k} className="animate-pulse">
                      <td className="p-3.5"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" /></td>
                      <td className="p-3.5"><div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="p-3.5 text-center"><div className="h-5 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                      <td className="p-3.5 text-center"><div className="h-5 w-24 mx-auto bg-slate-200 dark:bg-slate-700 rounded-md" /></td>
                      <td className="p-3.5 text-center"><div className="h-5 w-12 mx-auto bg-slate-200 dark:bg-slate-700 rounded-md" /></td>
                      <td className="p-3.5"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="p-3.5 text-center"><div className="h-4 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="p-3.5 text-center"><div className="h-6 w-14 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg" /></td>
                    </tr>
                  ))
                ) : sortedDeliverables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      <div className="text-xs font-bold">{isAr ? 'لا توجد تسليمات مطابقة لمعايير البحث' : 'No matching deliverables found'}</div>
                    </td>
                  </tr>
                ) : (
                  sortedDeliverables.map((deliv) => {
                    const milestone = getDeliverableMilestone(deliv);
                    const clientDeadline = getDeliverableClientDeadline(deliv);
                    const items = deliv.items || [];
                    const maxRev = items.reduce((max, i) => Math.max(max, i.current_rev || 0), 0);
                    const codeCCount = items.filter((i) => i.consultant_status === 'C').length;

                    return (
                      <tr 
                        key={deliv.id}
                        onClick={() => setSelectedDeliverableId(deliv.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        {/* Ref Code & Kind */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 shadow-xs">
                              {deliv.ref_code}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {deliv.kind}
                            </span>
                          </div>
                        </td>

                        {/* Title & Milestone Tag */}
                        <td className="p-3.5 max-w-md">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                              {deliv.title_ar}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {milestone && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Flag className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  <span>{milestone}</span>
                                </span>
                              )}
                              {deliv.status === 'blocked' && deliv.blocked_reason && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-xs">
                                  {isAr ? `عائق: ${deliv.blocked_reason}` : `Blocker: ${deliv.blocked_reason}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block border ${
                            deliv.status === 'blocked'
                              ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : deliv.status === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : deliv.status === 'ready_to_return'
                              ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : deliv.status === 'returned'
                              ? 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                              : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {columns.find((c) => c.status === deliv.status)?.title || deliv.status}
                          </span>
                        </td>

                        {/* Client Review Deadline */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {clientDeadline.deadline ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                clientDeadline.isOverdue
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                                  : clientDeadline.isUrgent
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                              }`}>
                                {isAr ? clientDeadline.statusLabelAr : clientDeadline.statusLabelEn}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {clientDeadline.deadline}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            deliv.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : deliv.priority === 'low'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          }`}>
                            {deliv.priority === 'high' ? (isAr ? 'عالية الأهمية' : 'High') : deliv.priority === 'low' ? (isAr ? 'منخفضة' : 'Low') : (isAr ? 'متوسطة' : 'Normal')}
                          </span>
                        </td>

                        {/* Holder */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {deliv.current_holder?.name_ar || deliv.current_holder?.role || (isAr ? 'المكتب الفني' : 'Technical Office')}
                            </span>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 font-mono text-[11px]">
                            <span className="text-slate-700 dark:text-slate-300">
                              {items.length} {isAr ? 'بنود' : 'items'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">|</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                              {isAr ? `إصدار ${maxRev}` : `Rev ${maxRev}`}
                            </span>
                            {codeCCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                                {codeCCount} {isAr ? 'ملاحظات كود C' : 'Code C'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedDeliverableId(deliv.id)}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              {isAr ? 'تفاصيل' : 'Details'}
                            </button>
                            {deliv.status === 'received' && (
                              <button
                                onClick={() => handleMoveStatus(deliv.id, 'in_progress')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                {isAr ? 'بدء' : 'Start'}
                              </button>
                            )}
                            {deliv.status === 'in_progress' && (
                              <button
                                onClick={() => handleMoveStatus(deliv.id, 'ready_to_return')}
                                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[11px] font-bold transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              >
                                {isAr ? 'جاهزة' : 'Ready'}
                              </button>
                            )}
                            {deliv.status === 'ready_to_return' && (
                              <button
                                onClick={() => handleMoveStatus(deliv.id, 'returned')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-bold transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                {isAr ? 'تسليم' : 'Deliver'}
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
        </div>
      )}

      {/* Deliverable Detail Drawer */}
      <DeliverableDetailDrawer
        isOpen={!!selectedDeliverableId}
        onClose={() => setSelectedDeliverableId(null)}
        deliverableId={selectedDeliverableId}
        onDeliverableUpdated={(updated) => {
          setDeliverables((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          announce(isAr ? `تم تحديث بيانات الحزمة: ${updated.ref_code}` : `Package updated: ${updated.ref_code}`);
        }}
      />

      {/* Blocker Modal */}
      <DeliverableBlockerModal
        isOpen={!!blockingDeliverable}
        onClose={() => setBlockingDeliverable(null)}
        deliverable={blockingDeliverable}
        onSuccess={(updated) => {
          setDeliverables((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setBlockingDeliverable(null);
          announce(isAr ? `تم تسجيل التعطيل للحزمة: ${updated.ref_code}` : `Blocker registered: ${updated.ref_code}`);
        }}
      />

      {/* Internal New Package Modal with Milestone & Client Review Deadline */}
      {isNewModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-package-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="new-package-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'استلام حزمة تسليمات جديدة' : 'Receive New Deliverable Package'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'تسجيل حزمة واردة من المكتب الفني للمشروع' : 'Register an incoming package from project technical office'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رمز الحزمة المرجعي' : 'Package Reference Code'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: E1-014' : 'e.g. E1-014'}
                    value={newForm.ref_code || ''}
                    onChange={(e) => setNewForm({ ...newForm, ref_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نوع الحزمة' : 'Package Kind'}
                  </label>
                  <select
                    value={newForm.kind}
                    onChange={(e) => setNewForm({ ...newForm, kind: e.target.value as Deliverable['kind'] })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
                  >
                    <option value="E1">{isAr ? 'مخططات تنفيذية (E1)' : 'Shop Drawings (E1)'}</option>
                    <option value="E2">{isAr ? 'عينات واعتمادات مواد (E2)' : 'Material Samples (E2)'}</option>
                    <option value="drawing_list">{isAr ? 'قائمة المخططات' : 'Drawing List'}</option>
                    <option value="material_list">{isAr ? 'قائمة المواد' : 'Material List'}</option>
                    <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'عنوان أو موضوع الحزمة' : 'Package Title or Subject'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: مخططات تسليح وتفاصيل إنشائية...' : 'e.g. Structural reinforcement drawings...'}
                  value={newForm.title_ar || ''}
                  onChange={(e) => setNewForm({ ...newForm, title_ar: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
                />
              </div>

              {/* Milestone Tag & Client Review Deadline Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المعلم التعاقدي' : 'Contractual Milestone'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: المعلم الأول - الأساسات' : 'e.g. Milestone 1 - Foundations'}
                    value={newForm.milestone_tag || ''}
                    onChange={(e) => setNewForm({ ...newForm, milestone_tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'مهلة مراجعة الاستشاري' : 'Consultant Review Deadline'}
                  </label>
                  <input
                    type="date"
                    value={newForm.client_review_deadline || ''}
                    onChange={(e) => setNewForm({ ...newForm, client_review_deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ الاستلام' : 'Received Date'}
                  </label>
                  <input
                    type="date"
                    value={newForm.received_at || ''}
                    onChange={(e) => setNewForm({ ...newForm, received_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as Deliverable['priority'] })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
                  >
                    <option value="normal">{isAr ? 'متوسطة' : 'Normal'}</option>
                    <option value="high">{isAr ? 'عالية الأهمية' : 'High'}</option>
                    <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white shadow-md shadow-emerald-700/20 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'تأكيد الاستلام' : 'Confirm Receipt')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
