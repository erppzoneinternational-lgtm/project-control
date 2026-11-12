"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { tenderService } from '@/lib/services/tender.service';
import { Tender, TenderBidder, TenderSummary, TenderStatus, TenderCategory } from '@/types/tender';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  TrendingUp,
  Trophy,
  LayoutGrid,
  List,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Award,
  ShieldCheck,
  ChevronRight,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  Sparkles,
  X,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const ALLOWED_ROLES = ['admin', 'commercial_manager', 'project_manager', 'coo', 'ceo', 'chairman', 'board_member'];

// ── Common Card Wrapper ───────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge('bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all', className)}>
      {children}
    </div>
  );
}

// ── Client Name Badge ─────────────────────────────────────────────────────────
function ClientNameBadge({ name, isRTL }: { name: string; isRTL: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/70 max-w-[200px] truncate"
      title={name}
      aria-label={`${isRTL ? 'الجهة المالكة / العميل' : 'Client'}: ${name}`}
    >
      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}

// ── Bid Submission Countdown Badge ───────────────────────────────────────────
interface BidCountdownBadgeProps {
  deadline: string;
  status: TenderStatus;
  isRTL: boolean;
  compact?: boolean;
}

function BidCountdownBadge({ deadline, status, isRTL, compact = false }: BidCountdownBadgeProps) {
  const countdown = useMemo(() => {
    if (status === 'awarded') {
      return {
        type: 'awarded',
        label: isRTL ? 'تمت الترسية' : 'Awarded',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        icon: CheckCircle2,
        isUrgent: false
      };
    }

    if (status === 'closed' || status === 'cancelled') {
      return {
        type: 'closed',
        label: isRTL ? 'المناقصة مغلقة' : 'Closed',
        classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        icon: Clock,
        isUrgent: false
      };
    }

    const targetDate = new Date(deadline).getTime();
    const now = Date.now();
    const diffMs = targetDate - now;

    if (isNaN(targetDate) || diffMs <= 0) {
      return {
        type: 'expired',
        label: isRTL ? 'انتهت فترة التقديم' : 'Submission Ended',
        classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        icon: AlertCircle,
        isUrgent: false
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;

    if (diffHours < 24) {
      return {
        type: 'critical',
        label: isRTL ? `ينتهي اليوم (متبقي ${diffHours} س)` : `Ends Today (${diffHours}h left)`,
        classes: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-bold',
        icon: Clock,
        isUrgent: true
      };
    }

    if (diffDays <= 3) {
      return {
        type: 'urgent',
        label: isRTL ? `عاجل (متبقي ${diffDays} يوم و ${remHours} س)` : `Urgent (${diffDays}d ${remHours}h left)`,
        classes: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold',
        icon: AlertTriangle,
        isUrgent: true
      };
    }

    if (diffDays <= 7) {
      return {
        type: 'warning',
        label: isRTL ? `متبقي ${diffDays} أيام` : `${diffDays} days left`,
        classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
        icon: Clock,
        isUrgent: false
      };
    }

    return {
      type: 'normal',
      label: isRTL ? `متبقي ${diffDays} يوماً` : `${diffDays} days left`,
      classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
      icon: Calendar,
      isUrgent: false
    };
  }, [deadline, status, isRTL]);

  const IconComponent = countdown.icon;
  const formattedDate = new Date(deadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border tracking-tight',
        countdown.classes,
        compact ? 'px-2 py-0.5 text-[11px]' : ''
      )}
      title={`${isRTL ? 'الموعد النهائي لتقديم العروض' : 'Bid submission deadline'}: ${formattedDate}`}
      aria-label={`${isRTL ? 'الموعد النهائي لتقديم العطاء' : 'Submission countdown'}: ${countdown.label}`}
    >
      {countdown.isUrgent && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      )}
      <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{countdown.label}</span>
    </span>
  );
}

// ── Accessible Status Badge ──────────────────────────────────────────────────
function TenderStatusBadge({ status, isRTL }: { status: TenderStatus; isRTL: boolean }) {
  const config: Record<TenderStatus, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
    draft: {
      label: isRTL ? 'مسودة' : 'Draft',
      classes: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: FileText
    },
    open: {
      label: isRTL ? 'مفتوح للتقديم' : 'Open for Bidding',
      classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      icon: Clock
    },
    under_evaluation: {
      label: isRTL ? 'تحت التقييم' : 'Under Evaluation',
      classes: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: AlertCircle
    },
    awarded: {
      label: isRTL ? 'تمت الترسية' : 'Awarded',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: Trophy
    },
    cancelled: {
      label: isRTL ? 'ملغاة' : 'Cancelled',
      classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: XCircle
    },
    closed: {
      label: isRTL ? 'مغلقة' : 'Closed',
      classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      icon: CheckCircle2
    }
  };

  const item = config[status] || config.draft;
  const Icon = item.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        item.classes
      )}
      role="status"
      aria-label={`${isRTL ? 'حالة المناقصة' : 'Tender status'}: ${item.label}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{item.label}</span>
    </span>
  );
}

// ── Proposal Status Card (Bidder Evaluation) ──────────────────────────────────
interface ProposalStatusCardProps {
  bidder: TenderBidder;
  tender: Tender;
  isRTL: boolean;
  onSelectBidder?: (bidder: TenderBidder) => void;
}

function ProposalStatusCard({ bidder, tender, isRTL, onSelectBidder }: ProposalStatusCardProps) {
  const variance = useMemo(() => {
    if (!tender.estimated_budget || tender.estimated_budget <= 0) return 0;
    return ((bidder.bid_amount - tender.estimated_budget) / tender.estimated_budget) * 100;
  }, [bidder.bid_amount, tender.estimated_budget]);

  const statusConfig = {
    shortlisted: {
      label: isRTL ? 'مؤهل بالقائمة القصيرة' : 'Shortlisted',
      badge: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      icon: Award
    },
    evaluated: {
      label: isRTL ? 'تم التقييم' : 'Evaluated',
      badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: FileText
    },
    accepted: {
      label: isRTL ? 'عرض فائز / مقبول' : 'Accepted (Winner)',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: Trophy
    },
    rejected: {
      label: isRTL ? 'مستبعد' : 'Disqualified',
      badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: XCircle
    }
  };

  const statusItem = statusConfig[bidder.status] || statusConfig.evaluated;
  const StatusIcon = statusItem.icon;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(val);

  return (
    <Card className="p-5 border-l-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Bidder Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {bidder.ranking && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
                  bidder.ranking === 1
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                )}
                aria-label={`${isRTL ? 'الترتيب' : 'Rank'}: #${bidder.ranking}`}
              >
                {bidder.ranking === 1 && <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
                {isRTL ? `الترتيب #${bidder.ranking}` : `Rank #${bidder.ranking}`}
              </span>
            )}
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                statusItem.badge
              )}
            >
              <StatusIcon className="w-3 h-3" aria-hidden="true" />
              <span>{statusItem.label}</span>
            </span>
          </div>

          <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {bidder.bidder_name}
          </h4>

          <p className="text-xs text-gray-500 dark:text-slate-400">
            {isRTL ? 'تاريخ تقديم العرض' : 'Submitted on'}:{' '}
            <span className="font-medium text-gray-700 dark:text-slate-300">
              {new Date(bidder.submitted_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
            </span>
          </p>
        </div>

        {/* Commercial Bid Amount */}
        <div className={clsx('text-start sm:text-end shrink-0', isRTL ? 'sm:text-left' : 'sm:text-right')}>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {isRTL ? 'قيمة العطاء المالي' : 'Commercial Offer'}
          </p>
          <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(bidder.bid_amount)}
          </p>
          <div className="flex items-center sm:justify-end gap-1 mt-0.5">
            {variance <= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{Math.abs(variance).toFixed(1)}% {isRTL ? 'أقل من التقدير' : 'below budget'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+{variance.toFixed(1)}% {isRTL ? 'أعلى من التقدير' : 'above budget'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Technical and Financial Score Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-gray-600 dark:text-slate-300">{isRTL ? 'التقييم الفني' : 'Technical Score'}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {bidder.technical_score !== null ? `${bidder.technical_score.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-500',
                (bidder.technical_score || 0) >= 85 ? 'bg-emerald-500' : (bidder.technical_score || 0) >= 70 ? 'bg-blue-500' : 'bg-rose-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, bidder.technical_score || 0))}%` }}
              role="progressbar"
              aria-valuenow={bidder.technical_score || 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={isRTL ? 'مؤشر التقييم الفني' : 'Technical score progress'}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-gray-600 dark:text-slate-300">{isRTL ? 'التقييم المالي' : 'Financial Score'}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {bidder.financial_score !== null ? `${bidder.financial_score.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-500',
                (bidder.financial_score || 0) >= 85 ? 'bg-emerald-500' : (bidder.financial_score || 0) >= 70 ? 'bg-blue-500' : 'bg-rose-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, bidder.financial_score || 0))}%` }}
              role="progressbar"
              aria-valuenow={bidder.financial_score || 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={isRTL ? 'مؤشر التقييم المالي' : 'Financial score progress'}
            />
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {isRTL ? 'الوزن المشترك:' : 'Composite Score:'}{' '}
          <strong className="text-gray-800 dark:text-slate-200">
            {bidder.technical_score && bidder.financial_score
              ? (bidder.technical_score * 0.6 + bidder.financial_score * 0.4).toFixed(1)
              : '—'}/100
          </strong>
        </span>

        <button
          type="button"
          onClick={() => {
            if (onSelectBidder) onSelectBidder(bidder);
            toast.info(isRTL ? `تم تحديد ملف عرض: ${bidder.bidder_name}` : `Selected proposal: ${bidder.bidder_name}`);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`${isRTL ? 'فحص وثائق ومرفقات العرض' : 'Examine proposal documents'} ${bidder.bidder_name}`}
        >
          <span>{isRTL ? 'فحص العرض الفني' : 'Examine Proposal'}</span>
          <ChevronRight className={clsx('w-3.5 h-3.5', isRTL && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

// ── Skeleton Loaders (No Layout Shift) ────────────────────────────────────────
function TenderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="جاري تحميل البيانات">
      {/* KPI Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-32"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
        <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg w-full md:w-96"></div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg w-36"></div>
          <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg w-36"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-6"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-28"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-36"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-full w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function TenderPage() {
  const { hasAnyRole, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { locale } = useLanguage();
  const isRTL = locale === 'ar';

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'list' (Tracking Board/Table) | 'evaluation' (Bid Comparison) | 'awards' (Awarded Contracts)
  const [activeTab, setActiveTab] = useState<'list' | 'evaluation' | 'awards'>('list');
  // View mode within 'list' tab: 'board' (Kanban) vs 'table' (List)
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Evaluation Sub-view
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [bidders, setBidders] = useState<TenderBidder[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);

  // Details Modal
  const [viewDetailsTender, setViewDetailsTender] = useState<Tender | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const hasAccess = isAdmin || hasAnyRole(ALLOWED_ROLES);

  useEffect(() => {
    if (!rolesLoading && hasAccess) {
      loadData();
    }
  }, [rolesLoading, hasAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tendersData, summaryData] = await Promise.all([
        tenderService.getTenders(),
        tenderService.getTenderSummary()
      ]);
      setTenders(tendersData);
      setSummary(summaryData);
      if (tendersData.length > 0 && !selectedTenderId) {
        // Pick the first tender in evaluation or open
        const underEval = tendersData.find(t => t.status === 'under_evaluation') || tendersData[0];
        setSelectedTenderId(underEval.id);
      }
    } catch (err) {
      toast.error(isRTL ? 'فشل في تحميل بيانات المناقصات' : 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  // Load bidders when selected tender changes or entering evaluation tab
  useEffect(() => {
    if (selectedTenderId && (activeTab === 'evaluation' || viewDetailsTender)) {
      loadBiddersForTender(selectedTenderId);
    }
  }, [selectedTenderId, activeTab]);

  const loadBiddersForTender = async (tenderId: string) => {
    setLoadingBidders(true);
    try {
      const data = await tenderService.getTenderBidders(tenderId);
      setBidders(data);
    } catch {
      setBidders([]);
    } finally {
      setLoadingBidders(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(val);

  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (t.title_ar && t.title_ar.toLowerCase().includes(q)) ||
        (t.title_en && t.title_en.toLowerCase().includes(q)) ||
        (t.tender_number && t.tender_number.toLowerCase().includes(q)) ||
        (t.client_name && t.client_name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tenders, searchTerm, statusFilter, categoryFilter]);

  // Selected tender object
  const currentEvaluationTender = useMemo(() => {
    return tenders.find(t => t.id === selectedTenderId) || tenders[0] || null;
  }, [tenders, selectedTenderId]);

  // Awarded tenders
  const awardedTenders = useMemo(() => {
    return tenders.filter(t => t.status === 'awarded');
  }, [tenders]);

  // Lifecycle stage mapping for Kanban tracking board
  const boardStages: { id: TenderStatus; title: string; colorClass: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'draft', title: isRTL ? 'مسودة' : 'Draft', colorClass: 'border-t-slate-400 dark:border-t-slate-600 bg-slate-50/60 dark:bg-slate-900/60', icon: FileText },
    { id: 'open', title: isRTL ? 'مفتوح للتقديم' : 'Open for Bidding', colorClass: 'border-t-blue-500 bg-blue-50/20 dark:bg-slate-900/60', icon: Clock },
    { id: 'under_evaluation', title: isRTL ? 'تحت التقييم' : 'Under Evaluation', colorClass: 'border-t-amber-500 bg-amber-50/20 dark:bg-slate-900/60', icon: AlertCircle },
    { id: 'awarded', title: isRTL ? 'تمت الترسية' : 'Awarded', colorClass: 'border-t-emerald-500 bg-emerald-50/20 dark:bg-slate-900/60', icon: Trophy },
    { id: 'closed', title: isRTL ? 'مغلقة ومؤرشفة' : 'Closed / Archived', colorClass: 'border-t-gray-400 dark:border-t-slate-600 bg-gray-50/40 dark:bg-slate-900/60', icon: ShieldCheck }
  ];

  if (rolesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <TenderSkeleton />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isRTL ? 'غير مصرح بالوصول' : 'Unauthorized Access'}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-md">
          {isRTL
            ? 'عفواً، لا تمتلك الصلاحيات الإدارية أو التجارية الكافية لاستعراض سجلات المناقصات والعطاءات.'
            : 'You do not have the required permissions to access the tender and bidding management dashboard.'}
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6', isRTL ? 'font-cairo' : '')} dir="rtl">
      {/* ── Page Header Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isRTL ? 'إدارة المبيعات والمناقصات الحكومية والخاصة' : 'Commercial & Tender Bidding Engine'}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black ${isRTL ? 'tracking-normal' : 'tracking-tight'}`}>

              {isRTL ? 'لوحة تتبع المناقصات والعطاءات' : 'Tender Tracking & Bid Management'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isRTL
                ? 'متابعة دورة حياة العطاءات، مؤقتات الموعد النهائي، فحص وتحليل العروض الفنية والمالية، ومؤشرات الترسية ونسب الفوز.'
                : 'Monitor tender lifecycle pipelines, countdown badges, evaluate technical and commercial proposals, and track contract awards.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
              aria-label={isRTL ? 'تحديث البيانات' : 'Refresh data'}
              title={isRTL ? 'تحديث البيانات' : 'Refresh data'}
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg shadow-blue-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label={isRTL ? 'إنشاء مناقصة جديدة' : 'Create new tender'}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{isRTL ? 'مناقصة جديدة' : 'New Tender'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenders */}
        <Card className="p-5 border-s-4 border-s-blue-500">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={`text-xs font-bold text-gray-500 dark:text-slate-400 ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                {isRTL ? 'إجمالي المناقصات' : 'Total Tenders'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                {summary?.totalTenders || tenders.length}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isRTL ? `${summary?.activeTenders || 0} مناقصة نشطة حالياً` : `${summary?.activeTenders || 0} active in pipeline`}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl" aria-hidden="true">
              <Building2 size={22} />
            </div>
          </div>
        </Card>

        {/* Active Pipeline Value */}
        <Card className="p-5 border-s-4 border-s-amber-500">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={`text-xs font-bold text-gray-500 dark:text-slate-400 ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                {isRTL ? 'قيمة العطاءات النشطة' : 'Active Pipeline Value'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(summary?.totalPipelineValue || 0)}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {isRTL ? 'مفتوحة أو قيد التقييم' : 'Open or in evaluation'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl" aria-hidden="true">
              <Clock size={22} />
            </div>
          </div>
        </Card>

        {/* Awarded Contracts Value */}
        <Card className="p-5 border-s-4 border-s-emerald-500">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={`text-xs font-bold text-gray-500 dark:text-slate-400 ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                {isRTL ? 'قيمة العقود المُرساة' : 'Awarded Value'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(summary?.awardedValue || 0)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isRTL ? `${awardedTenders.length} مناقصة تمت ترسيتها` : `${awardedTenders.length} tenders awarded`}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl" aria-hidden="true">
              <Trophy size={22} />
            </div>
          </div>
        </Card>

        {/* Win Rate */}
        <Card className="p-5 border-s-4 border-s-purple-500">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={`text-xs font-bold text-gray-500 dark:text-slate-400 ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                {isRTL ? 'معدل الفوز بالترسية' : 'Bid Win Rate'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                {(summary?.winRatePct ?? 0).toFixed(1)}%
              </h3>
              <div className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isRTL ? 'أداء منافسة مرتفع' : 'High competitive edge'}</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-xl" aria-hidden="true">
              <TrendingUp size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Tabs & View Modes ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="-mb-px flex flex-wrap gap-6" role="tablist" aria-label={isRTL ? 'أقسام المناقصات' : 'Tender navigation tabs'}>
          <button
            type="button"
            role="tab"
            id="tab-tracking"
            aria-selected={activeTab === 'list'}
            aria-controls="panel-tracking"
            onClick={() => setActiveTab('list')}
            className={clsx(
              'py-3.5 px-1 border-b-2 font-bold text-sm transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span>{isRTL ? 'لوحة تتبع المناقصات' : 'Tender Tracking'}</span>
            <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">
              {filteredTenders.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-evaluation"
            aria-selected={activeTab === 'evaluation'}
            aria-controls="panel-evaluation"
            onClick={() => setActiveTab('evaluation')}
            className={clsx(
              'py-3.5 px-1 border-b-2 font-bold text-sm transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeTab === 'evaluation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>{isRTL ? 'تقييم العروض والترسية' : 'Bid Evaluation'}</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-awards"
            aria-selected={activeTab === 'awards'}
            aria-controls="panel-awards"
            onClick={() => setActiveTab('awards')}
            className={clsx(
              'py-3.5 px-1 border-b-2 font-bold text-sm transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeTab === 'awards'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Trophy className="w-4 h-4" aria-hidden="true" />
            <span>{isRTL ? 'سجل الترسيات والعقود' : 'Awarded Contracts'}</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {awardedTenders.length}
            </span>
          </button>
        </nav>

        {/* View Mode Toggle (Active only on Tracking Tab) */}
        {activeTab === 'list' && (
          <div
            className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 self-start sm:self-auto mb-2 sm:mb-0"
            role="group"
            aria-label={isRTL ? 'خيارات العرض' : 'View options'}
          >
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              aria-pressed={viewMode === 'board'}
              aria-label={isRTL ? 'عرض لوحة المراحل (Kanban)' : 'Kanban board view'}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isRTL ? 'لوحة المراحل' : 'Board'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              )}
              aria-pressed={viewMode === 'table'}
              aria-label={isRTL ? 'عرض الجدول المفصل' : 'Table list view'}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isRTL ? 'جدول مفصل' : 'Table'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <label htmlFor="tender-search-input" className="sr-only">
              {isRTL ? 'بحث برقم المناقصة أو اسم المشروع أو العميل' : 'Search tenders'}
            </label>
            <div
              className={clsx(
                'absolute inset-y-0 flex items-center pointer-events-none text-gray-400 dark:text-slate-500',
                isRTL ? 'right-3' : 'left-3'
              )}
            >
              <Search size={18} aria-hidden="true" />
            </div>
            <input
              id="tender-search-input"
              type="text"
              className={clsx(
                'block w-full rounded-lg border-gray-300 dark:border-slate-700 py-2 sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-800/80 text-gray-900 dark:text-white border transition-colors',
                isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'
              )}
              placeholder={isRTL ? 'بحث برقم أو اسم المناقصة أو العميل...' : 'Search by number, project or client...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category & Status Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto items-center">
            {/* Category Filter */}
            <div className="w-full sm:w-auto">
              <label htmlFor="category-filter-select" className="sr-only">
                {isRTL ? 'تصفية حسب التصنيف' : 'Filter by category'}
              </label>
              <select
                id="category-filter-select"
                className="block w-full rounded-lg border-gray-300 dark:border-slate-700 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border cursor-pointer"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">{isRTL ? 'جميع التصنيفات' : 'All Categories'}</option>
                <option value="civil">{isRTL ? 'إنشائي ومدني (Civil)' : 'Civil'}</option>
                <option value="mep">{isRTL ? 'كهروميكانيك (MEP)' : 'MEP'}</option>
                <option value="infrastructure">{isRTL ? 'بنية تحتية (Infrastructure)' : 'Infrastructure'}</option>
                <option value="fitout">{isRTL ? 'تشطيبات وديكور (Fitout)' : 'Fitout'}</option>
                <option value="turnkey">{isRTL ? 'تسليم مفتاح (Turnkey)' : 'Turnkey'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto">
              <label htmlFor="status-filter-select" className="sr-only">
                {isRTL ? 'تصفية حسب الحالة' : 'Filter by status'}
              </label>
              <select
                id="status-filter-select"
                className="block w-full rounded-lg border-gray-300 dark:border-slate-700 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border cursor-pointer"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="draft">{isRTL ? 'مسودة' : 'Draft'}</option>
                <option value="open">{isRTL ? 'مفتوح للتقديم' : 'Open'}</option>
                <option value="under_evaluation">{isRTL ? 'تحت التقييم' : 'Under Evaluation'}</option>
                <option value="awarded">{isRTL ? 'تمت الترسية' : 'Awarded'}</option>
                <option value="closed">{isRTL ? 'مغلقة' : 'Closed'}</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 shrink-0"
              >
                {isRTL ? 'إلغاء التصفية' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tab Content Panels ────────────────────────────────────────────── */}
      {loading ? (
        <TenderSkeleton />
      ) : activeTab === 'list' ? (
        /* TAB 1: Tender Tracking (Board or Table) */
        <div id="panel-tracking" role="tabpanel" aria-labelledby="tab-tracking">
          {filteredTenders.length === 0 ? (
            <Card className="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-gray-400 dark:text-slate-500">
                <Filter size={32} />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {isRTL ? 'لا توجد مناقصات مطابقة' : 'No matching tenders'}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                {isRTL ? 'جرّب تعديل معايير البحث أو اختيار تصنيف/حالة أخرى' : 'Try adjusting your search criteria or filter options'}
              </p>
            </Card>
          ) : viewMode === 'board' ? (
            /* 1A. KANBAN TRACKING BOARD */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
              {boardStages.map(stage => {
                const stageTenders = filteredTenders.filter(t => t.status === stage.id);
                const stageTotalValue = stageTenders.reduce((acc, t) => acc + (Number(t.estimated_budget) || 0), 0);
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    className={clsx(
                      'rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-3 border-t-4 transition-all',
                      stage.colorClass
                    )}
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <StageIcon className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{stage.title}</h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 shadow-sm">
                        {stageTenders.length}
                      </span>
                    </div>

                    {/* Stage Value Metric */}
                    <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                      {isRTL ? 'القيمة التقديرية:' : 'Stage Value:'}{' '}
                      <span className="font-bold text-gray-800 dark:text-slate-200 tabular-nums">
                        {formatCurrency(stageTotalValue)}
                      </span>
                    </div>

                    {/* Stage Tender Cards */}
                    <div className="space-y-3 min-h-[150px]">
                      {stageTenders.length === 0 ? (
                        <div className="border border-dashed border-gray-200 dark:border-slate-800 rounded-lg p-6 text-center text-xs text-gray-400 dark:text-slate-500">
                          {isRTL ? 'لا توجد مناقصات في هذه المرحلة' : 'No tenders in this stage'}
                        </div>
                      ) : (
                        stageTenders.map(tender => (
                          <div
                            key={tender.id}
                            onClick={() => setViewDetailsTender(tender)}
                            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setViewDetailsTender(tender);
                              }
                            }}
                            aria-label={`${isRTL ? 'عرض تفاصيل المناقصة' : 'View tender'} ${tender.tender_number}`}
                          >
                            {/* Card Top: Number & Category */}
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                {tender.tender_number}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {tender.category}
                              </span>
                            </div>

                            {/* Card Title */}
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {isRTL ? tender.title_ar : tender.title_en}
                            </h4>

                            {/* Client Name Badge */}
                            <div>
                              <ClientNameBadge name={tender.client_name} isRTL={isRTL} />
                            </div>

                            {/* Budget & Bond Guarantee */}
                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-xs">
                              <div>
                                <span className="text-[11px] text-gray-400 dark:text-slate-500 block">{isRTL ? 'الميزانية' : 'Budget'}</span>
                                <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                                  {formatCurrency(tender.estimated_budget)}
                                </span>
                              </div>

                              {tender.bond_amount && (
                                <span
                                  className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1"
                                  title={`${isRTL ? 'الضمان الابتدائي' : 'Bid Bond'}: ${formatCurrency(tender.bond_amount)}`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                                  <span>{isRTL ? 'ضمان 5%' : 'Bond'}</span>
                                </span>
                              )}
                            </div>

                            {/* Countdown Badge */}
                            <div className="pt-1">
                              <BidCountdownBadge
                                deadline={tender.submission_deadline}
                                status={tender.status}
                                isRTL={isRTL}
                                compact
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 1B. DETAILED TABLE VIEW (With RTL Alignment & Badges) */
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800" aria-label={isRTL ? 'جدول المناقصات' : 'Tenders table'}>
                  <thead className="bg-gray-50 dark:bg-slate-800/60">
                    <tr>
                      <th scope="col" className={clsx('px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400', isRTL ? 'text-right tracking-normal' : 'text-left uppercase tracking-wider')}>
                        {isRTL ? 'رقم المناقصة' : 'Tender No.'}
                      </th>
                      <th scope="col" className={clsx('px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400', isRTL ? 'text-right tracking-normal' : 'text-left uppercase tracking-wider')}>
                        {isRTL ? 'اسم المشروع والتصنيف' : 'Project & Category'}
                      </th>
                      <th scope="col" className={clsx('px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400', isRTL ? 'text-right tracking-normal' : 'text-left uppercase tracking-wider')}>
                        {isRTL ? 'الجهة المالكة (العميل)' : 'Client'}
                      </th>
                      <th scope="col" className={clsx('px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400', isRTL ? 'text-right tracking-normal' : 'text-left uppercase tracking-wider')}>
                        {isRTL ? 'الميزانية التقديرية' : 'Est. Budget'}
                      </th>
                      <th scope="col" className={`px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 text-center ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                        {isRTL ? 'الحالة' : 'Status'}
                      </th>
                      <th scope="col" className={clsx('px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400', isRTL ? 'text-right tracking-normal' : 'text-left uppercase tracking-wider')}>
                        {isRTL ? 'الموعد النهائي ومؤقت التقديم' : 'Deadline & Countdown'}
                      </th>
                      <th scope="col" className={`px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 text-center ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                        {isRTL ? 'إجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredTenders.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => setViewDetailsTender(t)}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. Tender Number */}
                        <td className={clsx('px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400 font-mono', isRTL ? 'text-right' : 'text-left')}>
                          {t.tender_number}
                        </td>

                        {/* 2. Project Title & Category */}
                        <td className={clsx('px-6 py-4 text-sm text-gray-900 dark:text-white', isRTL ? 'text-right' : 'text-left')}>
                          <div className="font-bold line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {isRTL ? t.title_ar : t.title_en}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase">
                            {t.category}
                          </span>
                        </td>

                        {/* 3. Client Name Badge */}
                        <td className={clsx('px-6 py-4 whitespace-nowrap', isRTL ? 'text-right' : 'text-left')}>
                          <ClientNameBadge name={t.client_name} isRTL={isRTL} />
                        </td>

                        {/* 4. Estimated Budget */}
                        <td className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold tabular-nums', isRTL ? 'text-right' : 'text-left')}>
                          {formatCurrency(t.estimated_budget)}
                        </td>

                        {/* 5. Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <TenderStatusBadge status={t.status} isRTL={isRTL} />
                        </td>

                        {/* 6. Bid Countdown Badge */}
                        <td className={clsx('px-6 py-4 whitespace-nowrap', isRTL ? 'text-right' : 'text-left')}>
                          <BidCountdownBadge deadline={t.submission_deadline} status={t.status} isRTL={isRTL} />
                        </td>

                        {/* 7. Action Button */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setViewDetailsTender(t);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={`${isRTL ? 'عرض تفاصيل المناقصة' : 'View tender details'} ${t.tender_number}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : activeTab === 'evaluation' ? (
        /* TAB 2: BID EVALUATION WORKSPACE */
        <div id="panel-evaluation" role="tabpanel" aria-labelledby="tab-evaluation" className="space-y-6">
          {/* Tender Selector Header */}
          <Card className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {currentEvaluationTender?.tender_number}
                  </span>
                  <TenderStatusBadge status={currentEvaluationTender?.status || 'under_evaluation'} isRTL={isRTL} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isRTL ? currentEvaluationTender?.title_ar : currentEvaluationTender?.title_en}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <ClientNameBadge name={currentEvaluationTender?.client_name || ''} isRTL={isRTL} />
                  <span>
                    {isRTL ? 'الميزانية التقديرية:' : 'Estimated Budget:'}{' '}
                    <strong className="text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(currentEvaluationTender?.estimated_budget || 0)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Tender Switcher Dropdown */}
              <div className="w-full md:w-80">
                <label htmlFor="evaluation-tender-select" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'اختر مناقصة لتقييم عروضها:' : 'Select tender to evaluate:'}
                </label>
                <select
                  id="evaluation-tender-select"
                  value={selectedTenderId}
                  onChange={e => setSelectedTenderId(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-700 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border cursor-pointer"
                >
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tender_number} - {isRTL ? t.title_ar : t.title_en} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Proposal Status Cards Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'عروض المقاولين والشركات المتنافسة' : 'Bidders & Commercial Proposals'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {isRTL
                    ? `إجمالي العروض المستلمة: ${bidders.length} شركات`
                    : `Total proposals submitted: ${bidders.length} bidders`}
                </p>
              </div>

              <BidCountdownBadge
                deadline={currentEvaluationTender?.submission_deadline || ''}
                status={currentEvaluationTender?.status || 'under_evaluation'}
                isRTL={isRTL}
              />
            </div>

            {loadingBidders ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
                ))}
              </div>
            ) : bidders.length === 0 ? (
              <Card className="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center">
                <FileText size={40} className="text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {isRTL ? 'لم يتم تقديم أي عروض بعد لهذه المناقصة' : 'No proposals submitted yet for this tender'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                  {isRTL ? 'بانتظار استقبال وثائق العطاءات الفنية والمالية من المقاولين' : 'Awaiting technical and commercial bid submittals'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bidders.map(bidder => (
                  <ProposalStatusCard
                    key={bidder.id}
                    bidder={bidder}
                    tender={currentEvaluationTender!}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 3: AWARDS & OUTCOMES */
        <div id="panel-awards" role="tabpanel" aria-labelledby="tab-awards" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'سجل المناقصات المُرساة والعقود المعتمدة' : 'Awarded Tenders & Approved Contracts'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {isRTL
                    ? 'المناقصات التي اكتمل تقييمها الفني والمالي وتم إشعار الترسية وتجهيز العقد التنفيذي.'
                    : 'Tenders with completed evaluations and issued award notifications ready for project setup.'}
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-start sm:text-end">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                  {isRTL ? 'إجمالي قيمة الترسيات' : 'Total Awarded Portfolio'}
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(summary?.awardedValue || 0)}
                </span>
              </div>
            </div>

            {awardedTenders.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                <Trophy size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {isRTL ? 'لا توجد مناقصات مُرساة حالياً' : 'No awarded tenders found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {awardedTenders.map(tender => (
                  <Card key={tender.id} className="p-5 border-emerald-200 dark:border-emerald-900 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          {tender.tender_number}
                        </span>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                          {isRTL ? tender.title_ar : tender.title_en}
                        </h4>
                        <ClientNameBadge name={tender.client_name} isRTL={isRTL} />
                      </div>
                      <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                        <Trophy size={20} />
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 dark:text-slate-500 block">{isRTL ? 'قيمة العقد المعتمد' : 'Awarded Budget'}</span>
                        <span className="font-bold text-gray-900 dark:text-white text-sm tabular-nums">
                          {formatCurrency(tender.estimated_budget)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-slate-500 block">{isRTL ? 'الضمان النهائي' : 'Performance Bond'}</span>
                        <span className="font-bold text-gray-900 dark:text-white text-sm tabular-nums">
                          {tender.bond_amount ? formatCurrency(tender.bond_amount) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                      <BidCountdownBadge deadline={tender.submission_deadline} status={tender.status} isRTL={isRTL} />
                      <button
                        type="button"
                        onClick={() => setViewDetailsTender(tender)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
                      >
                        <span>{isRTL ? 'تفاصيل الترسية' : 'Award Details'}</span>
                        <ChevronRight className={clsx('w-3.5 h-3.5', isRTL && 'rotate-180')} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Modal: Tender Details & Bidders ───────────────────────────────── */}
      {viewDetailsTender && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tender-details-title"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800 shadow-2xl p-6 space-y-6"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {viewDetailsTender.tender_number}
                  </span>
                  <TenderStatusBadge status={viewDetailsTender.status} isRTL={isRTL} />
                  <span className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {viewDetailsTender.category}
                  </span>
                </div>
                <h3 id="tender-details-title" className="text-xl font-black text-gray-900 dark:text-white">
                  {isRTL ? viewDetailsTender.title_ar : viewDetailsTender.title_en}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsTender(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={isRTL ? 'إغلاق النافذة' : 'Close modal'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs">
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'الجهة المالكة' : 'Client'}</span>
                <ClientNameBadge name={viewDetailsTender.client_name} isRTL={isRTL} />
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'الميزانية التقديرية' : 'Estimated Budget'}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(viewDetailsTender.estimated_budget)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'مؤقت التقديم' : 'Countdown'}</span>
                <BidCountdownBadge deadline={viewDetailsTender.submission_deadline} status={viewDetailsTender.status} isRTL={isRTL} compact />
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'قيمة الضمان البنكي' : 'Bank Bond'}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">
                  {viewDetailsTender.bond_amount ? formatCurrency(viewDetailsTender.bond_amount) : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'صلاحية الضمان' : 'Bond Validity'}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {viewDetailsTender.bond_validity_days ? `${viewDetailsTender.bond_validity_days} ${isRTL ? 'يوم' : 'days'}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400 block mb-1">{isRTL ? 'تاريخ الإغلاق' : 'Deadline Date'}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {new Date(viewDetailsTender.submission_deadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>

            {/* Description */}
            {viewDetailsTender.description && (
              <div className="space-y-1">
                <h4 className={`text-xs font-bold text-gray-700 dark:text-slate-300 ${isRTL ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                  {isRTL ? 'نطاق العمل والوصف الفني' : 'Scope & Technical Description'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                  {viewDetailsTender.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTenderId(viewDetailsTender.id);
                  setActiveTab('evaluation');
                  setViewDetailsTender(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isRTL ? 'الانتقال لتقييم العروض' : 'Go to Bid Evaluation'}
              </button>
              <button
                type="button"
                onClick={() => setViewDetailsTender(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: New Tender Creation ────────────────────────────────────── */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-tender-modal-title"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 dark:border-slate-800 shadow-2xl"
            dir="rtl"
          >
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 id="new-tender-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {isRTL ? 'إضافة مناقصة جديدة' : 'Create New Tender'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newTender: Tender = {
                  id: `tnd-${Date.now()}`,
                  tender_number: String(formData.get('tender_number') || `TND-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`),
                  title_ar: String(formData.get('title_ar') || ''),
                  title_en: String(formData.get('title_en') || formData.get('title_ar') || ''),
                  client_name: String(formData.get('client_name') || ''),
                  category: (formData.get('category') as TenderCategory) || 'civil',
                  status: 'open',
                  estimated_budget: Number(formData.get('estimated_budget')) || 10000000,
                  submission_deadline: String(formData.get('submission_deadline')) || new Date(Date.now() + 14 * 86400000).toISOString(),
                  bond_amount: Number(formData.get('bond_amount')) || null,
                  bond_validity_days: 90,
                  description: String(formData.get('description') || ''),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                tenderService.saveTender(newTender);
                setTenders(prev => [newTender, ...prev]);
                setShowNewModal(false);
                toast.success(isRTL ? 'تم إنشاء المناقصة بنجاح' : 'Tender created successfully');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'اسم المناقصة بالعربية' : 'Arabic Title'}
                </label>
                <input
                  name="title_ar"
                  required
                  placeholder={isRTL ? 'مثال: مشروع مجمع الواحة الطبي' : 'e.g. Al-Waha Medical Complex'}
                  className="w-full rounded-lg border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm border focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الجهة المالكة (العميل)' : 'Client Name'}
                  </label>
                  <input
                    name="client_name"
                    required
                    placeholder={isRTL ? 'مثال: وزارة الصحة' : 'e.g. Ministry of Health'}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm border focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    name="category"
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm border"
                  >
                    <option value="civil">{isRTL ? 'مدني (Civil)' : 'Civil'}</option>
                    <option value="mep">{isRTL ? 'كهروميكانيك (MEP)' : 'MEP'}</option>
                    <option value="infrastructure">{isRTL ? 'بنية تحتية' : 'Infrastructure'}</option>
                    <option value="turnkey">{isRTL ? 'تسليم مفتاح' : 'Turnkey'}</option>
                    <option value="fitout">{isRTL ? 'تشطيبات وديكور' : 'Fitout'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الميزانية التقديرية (SAR)' : 'Estimated Budget'}
                  </label>
                  <input
                    type="number"
                    name="estimated_budget"
                    required
                    placeholder="25000000"
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm border tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الموعد النهائي للتقديم' : 'Submission Deadline'}
                  </label>
                  <input
                    type="date"
                    name="submission_deadline"
                    required
                    defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm border"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
                >
                  {isRTL ? 'حفظ المناقصة' : 'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
