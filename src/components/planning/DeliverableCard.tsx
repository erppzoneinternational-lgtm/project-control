'use client';

import React, { useMemo } from 'react';
import { 
  Clock, 
  User, 
  AlertTriangle, 
  Layers, 
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Calendar,
  Flag,
  GripHorizontal,
} from 'lucide-react';
import { Deliverable, DeliverableStatus, DeliverableKind } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDeliverableMilestone, getDeliverableClientDeadline } from '@/lib/planning/deliverable-helpers';

interface DeliverableCardProps {
  deliverable: Deliverable;
  onSelect: (deliv: Deliverable) => void;
  onMoveStatus?: (id: string, newStatus: DeliverableStatus, reason?: string) => void;
  onBlock?: (deliv: Deliverable) => void;
  onDelete?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

export const DeliverableCard: React.FC<DeliverableCardProps> = ({
  deliverable,
  onSelect,
  onMoveStatus,
  onBlock,
  draggable = true,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Milestone Tag & Client Review Deadline helpers
  const milestone = useMemo(() => getDeliverableMilestone(deliverable), [deliverable]);
  const clientDeadline = useMemo(() => getDeliverableClientDeadline(deliverable), [deliverable]);

  // Age in days
  const ageDays = useMemo(() => {
    if (!deliverable.received_at) return 0;
    const received = new Date(deliverable.received_at).getTime();
    const now = Date.now();
    const diff = Math.floor((now - received) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [deliverable.received_at]);

  // Days blocked
  const daysBlocked = useMemo(() => {
    if (!deliverable.blocked_since) return 0;
    const blocked = new Date(deliverable.blocked_since).getTime();
    const now = Date.now();
    const diff = Math.floor((now - blocked) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [deliverable.blocked_since]);

  // Items summary
  const items = deliverable.items || [];
  const drawingsCount = items.filter((i) => i.item_type === 'drawing').length;
  const materialsCount = items.filter((i) => i.item_type === 'material').length;
  const maxRev = items.reduce((max, i) => Math.max(max, i.current_rev || 0), 0);
  const codeCCount = items.filter((i) => i.consultant_status === 'C').length;

  const isBlocked = deliverable.status === 'blocked';

  const statusLabelsAr: Record<DeliverableStatus, string> = {
    received: 'مستلمة',
    in_progress: 'قيد التنفيذ',
    ready_to_return: 'جاهزة للإعادة',
    returned: 'تمت الإعادة والتسليم',
    blocked: 'معطلة بوجود عائق',
    approved: 'معتمد',
    rejected: 'مرفوض',
  };

  const statusLabelsEn: Record<DeliverableStatus, string> = {
    received: 'Received',
    in_progress: 'In Progress',
    ready_to_return: 'Ready to Return',
    returned: 'Returned',
    blocked: 'Blocked',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'low':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      case 'normal':
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return isAr ? 'أولوية قصوى' : 'High Priority';
      case 'low':
        return isAr ? 'أولوية منخفضة' : 'Low Priority';
      case 'normal':
      default:
        return isAr ? 'أولوية عادية' : 'Normal Priority';
    }
  };

  const getKindBadge = (kind: DeliverableKind) => {
    switch (kind) {
      case 'E1':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'E2':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900';
      case 'material_list':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'drawing_list':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getKindLabel = (kind: DeliverableKind) => {
    switch (kind) {
      case 'E1':
        return isAr ? 'نموذج E1' : 'E1 Form';
      case 'E2':
        return isAr ? 'نموذج E2' : 'E2 Form';
      case 'material_list':
        return isAr ? 'اعتماد مواد' : 'Material Submittal';
      case 'drawing_list':
        return isAr ? 'مخططات تنفيذية' : 'Shop Drawings';
      default:
        return kind;
    }
  };

  const handleQuickMove = (e: React.MouseEvent, targetStatus: DeliverableStatus) => {
    e.stopPropagation();
    if (targetStatus === 'blocked') {
      if (onBlock) {
        onBlock(deliverable);
      } else if (onMoveStatus) {
        onMoveStatus(deliverable.id, 'blocked', isAr ? 'تم التعليق عبر الإجراء السريع' : 'Blocked via quick action');
      }
    } else if (onMoveStatus) {
      onMoveStatus(deliverable.id, targetStatus);
    }
  };

  const accessibleLabel = isAr
    ? `${deliverable.ref_code}: ${deliverable.title_ar || deliverable.title_en || ''} - الحالة: ${
        statusLabelsAr[deliverable.status] || deliverable.status
      }${milestone ? ` - المعلم التعاقدي: ${milestone}` : ''}${clientDeadline.isOverdue ? ' - متأخر عن الموعد' : ''}`
    : `${deliverable.ref_code}: ${deliverable.title_en || deliverable.title_ar || ''} - Status: ${
        statusLabelsEn[deliverable.status] || deliverable.status
      }${milestone ? ` - Milestone: ${milestone}` : ''}${clientDeadline.isOverdue ? ' - Overdue' : ''}`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={accessibleLabel}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(deliverable)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(deliverable);
        }
      }}
      className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5 border focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDragging ? 'opacity-40 scale-95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-none' : ''
      } ${
        isBlocked
          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-700/80 ring-1 ring-rose-500/20 hover:border-rose-500 dark:hover:border-rose-600'
          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500'
      }`}
    >
      {/* Top badges & Ref code */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 shadow-xs flex items-center gap-1">
            <GripHorizontal className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-400 transition" />
            <span>{deliverable.ref_code}</span>
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getKindBadge(deliverable.kind)}`}>
            {getKindLabel(deliverable.kind)}
          </span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadge(deliverable.priority)}`}>
            {getPriorityLabel(deliverable.priority)}
          </span>
        </div>

        {/* Age pill */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <Clock className="w-3 h-3" />
          <span>{isAr ? `${ageDays} يوم` : `${ageDays}d`}</span>
        </div>
      </div>

      {/* Milestone Tag if present */}
      {milestone && (
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-2xs"
            title={isAr ? `المعلم التعاقدي: ${milestone}` : `Contractual Milestone: ${milestone}`}
          >
            <Flag className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate max-w-[200px]">{milestone}</span>
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed mb-2.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
        {(isAr ? deliverable.title_ar : deliverable.title_en) || deliverable.title_ar || deliverable.title_en}
      </h3>

      {/* Blocked Alert Banner */}
      {isBlocked && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 text-xs space-y-1 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{isAr ? `معطلة منذ ${daysBlocked} يوم` : `Blocked for ${daysBlocked} days`}</span>
            </span>
            <span className="text-[10px] font-semibold bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700">
              {isAr ? 'عائق نشط' : 'Active Impediment'}
            </span>
          </div>
          {deliverable.blocked_reason && (
            <p className="text-[11px] leading-tight line-clamp-2 text-rose-800 dark:text-rose-200 font-medium">
              {isAr ? `سبب التعليق: ${deliverable.blocked_reason}` : `Reason: ${deliverable.blocked_reason}`}
            </p>
          )}
        </div>
      )}

      {/* Client Review Deadline / Due Date Pill */}
      {clientDeadline.deadline && (
        <div className="mb-2.5 flex items-center justify-between gap-1.5">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shrink-0 shadow-2xs ${
              clientDeadline.isOverdue
                ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700 animate-pulse'
                : clientDeadline.isUrgent
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                : 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200 border-sky-300 dark:border-sky-700'
            }`}
            title={
              isAr
                ? `المهلة المحددة لمراجعة الاستشاري: ${clientDeadline.deadline}`
                : `Consultant Review Deadline: ${clientDeadline.deadline}`
            }
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>{isAr ? clientDeadline.statusLabelAr : clientDeadline.statusLabelEn}</span>
          </div>
          <span
            className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-medium bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
            title={isAr ? 'تاريخ مهلة المراجعة' : 'Review deadline date'}
          >
            {clientDeadline.deadline}
          </span>
        </div>
      )}

      {/* Holder & Due Date */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {(isAr ? deliverable.current_holder?.name_ar : deliverable.current_holder?.name_en) ||
              deliverable.current_holder?.name_ar ||
              deliverable.current_holder?.role ||
              (isAr ? 'المكتب الفني' : 'Technical Office')}
          </span>
        </div>

        {deliverable.due_date && !clientDeadline.deadline && (
          <div
            className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0"
            title={isAr ? 'تاريخ الاستحقاق' : 'Due date'}
          >
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{deliverable.due_date}</span>
          </div>
        )}
      </div>

      {/* Items Summary & Revision Chips */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1" title={isAr ? 'إجمالي البنود واللوحات' : 'Total items and drawings'}>
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{items.length} {isAr ? 'بنود' : 'items'}</span>
          </span>
          {drawingsCount > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-semibold">
              {drawingsCount} {isAr ? 'لوحة' : 'dwg'}
            </span>
          )}
          {materialsCount > 0 && (
            <span className="text-amber-700 dark:text-amber-400 font-mono text-[10px] font-semibold">
              {materialsCount} {isAr ? 'عينات' : 'mat'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {codeCCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
              title={isAr ? 'بنود تتطلب إعادة التقديم (ملاحظات الاستشاري)' : 'Items requiring resubmission (Code C)'}
            >
              {isAr ? `${codeCCount} إعادة تقديم` : `${codeCCount} Code C`}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            {isAr ? `إصدار ${maxRev}` : `Rev ${maxRev}`}
          </span>
        </div>
      </div>

      {/* Fast Move Action Buttons (Hover / Quick Bar) */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
        {deliverable.status === 'received' && (
          <button
            type="button"
            onClick={(e) => handleQuickMove(e, 'in_progress')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition shadow-2xs"
          >
            <span>{isAr ? 'بدء العمل' : 'Start work'}</span>
            <ArrowLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
          </button>
        )}

        {deliverable.status === 'in_progress' && (
          <div className="w-full flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleQuickMove(e, 'ready_to_return')}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition shadow-2xs"
            >
              <span>{isAr ? 'جاهزة للإعادة' : 'Ready to return'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleQuickMove(e, 'blocked')}
              className="py-1.5 px-2.5 rounded-xl text-[10px] font-bold bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 transition shadow-2xs"
              title={isAr ? 'تسجيل عائق أو تعليق' : 'Flag blockage / impediment'}
              aria-label={isAr ? 'تسجيل عائق أو تعليق' : 'Flag blockage / impediment'}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {deliverable.status === 'blocked' && (
          <button
            type="button"
            onClick={(e) => handleQuickMove(e, 'in_progress')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 transition shadow-2xs"
          >
            <span>{isAr ? 'إلغاء التعليق واستئناف العمل' : 'Resume work'}</span>
          </button>
        )}

        {deliverable.status === 'ready_to_return' && (
          <button
            type="button"
            onClick={(e) => handleQuickMove(e, 'returned')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسليم للمكتب الفني' : 'Submit to technical office'}</span>
          </button>
        )}

        {deliverable.status === 'returned' && (
          <div className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تمت الإعادة والتسليم' : 'Returned and acknowledged'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
