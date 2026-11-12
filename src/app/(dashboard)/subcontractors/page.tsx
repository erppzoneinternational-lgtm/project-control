'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  HardHat,
  Star,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  BadgePercent,
  Eye,
  X,
  RefreshCw,
  Briefcase,
  ShieldCheck,
  Layers,
  Zap,
  Hammer,
  Droplets,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProjectService } from '@/lib/services/project.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { supabase } from '@/lib/supabase';
import { Project, ProjectSubcontractor } from '@/types';
import { toast } from 'sonner';

// Trade specializations and metadata
export type TradeCategory =
  | 'all'
  | 'civil'
  | 'mep'
  | 'finishes'
  | 'hvac'
  | 'waterproofing'
  | 'infrastructure'
  | 'steel';

export interface TradeConfig {
  id: TradeCategory;
  nameAr: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const TRADE_CONFIGS: Record<TradeCategory, TradeConfig> = {
  all: {
    id: 'all',
    nameAr: 'جميع التخصصات',
    nameEn: 'All Trades',
    icon: Briefcase,
    tone: 'text-slate-500 dark:text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    badgeText: 'text-slate-700 dark:text-slate-300',
  },
  civil: {
    id: 'civil',
    nameAr: 'أعمال خرسانية وإنشائية',
    nameEn: 'Civil & Structural',
    icon: Building2,
    tone: 'text-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBorder: 'border-amber-200 dark:border-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  mep: {
    id: 'mep',
    nameAr: 'كهروميكانيك وصحي',
    nameEn: 'MEP & Plumbing',
    icon: Zap,
    tone: 'text-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeBorder: 'border-sky-200 dark:border-sky-900/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  finishes: {
    id: 'finishes',
    nameAr: 'تشطيبات وديكور معماري',
    nameEn: 'Finishes & Fit-Out',
    icon: Layers,
    tone: 'text-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBorder: 'border-emerald-200 dark:border-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  hvac: {
    id: 'hvac',
    nameAr: 'تكييف وتهوية مركزية',
    nameEn: 'HVAC Systems',
    icon: ShieldCheck,
    tone: 'text-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeBorder: 'border-blue-200 dark:border-blue-900/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  waterproofing: {
    id: 'waterproofing',
    nameAr: 'عزل مائي وحراري',
    nameEn: 'Waterproofing & Insulation',
    icon: Droplets,
    tone: 'text-teal-500',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBorder: 'border-teal-200 dark:border-teal-900/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
  },
  infrastructure: {
    id: 'infrastructure',
    nameAr: 'بنية تحتية وشبكات',
    nameEn: 'Infrastructure & Earthworks',
    icon: HardHat,
    tone: 'text-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeBorder: 'border-indigo-200 dark:border-indigo-900/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
  },
  steel: {
    id: 'steel',
    nameAr: 'هياكل معدنية وجمالونات',
    nameEn: 'Structural Steel',
    icon: Hammer,
    tone: 'text-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeBorder: 'border-purple-200 dark:border-purple-900/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
};

// Enriched Subcontractor Entity
export interface EnrichedSubcontractor {
  id: string;
  project_id: string;
  project_name: string;
  project_code: string;
  company_name: string;
  specialization: string;
  trade_category: TradeCategory;
  scope_description: string;
  contract_value: number;
  status: 'active' | 'suspended' | 'completed';
  contract_status: string;
  rating?: number | null;
  rating_tier?: 'exceptional' | 'very_good' | 'standard' | 'underperforming' | 'unrated';
  achievement_pct?: number | null;
  is_underperforming?: boolean;
  active_contracts_count: number;
  rep_name?: string | null;
  rep_phone?: string | null;
  rep_email?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}


// Currency Formatter for Egyptian Pounds (EGP)
const fmtEGP = (v: number) =>
  new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(v || 0);

// Compact currency representation for cards/KPIs
const fmtCompactEGP = (v: number, isAr = true) => {
  if (v >= 1_000_000) {
    return isAr ? `${(v / 1_000_000).toFixed(1)} مليون ج.م` : `${(v / 1_000_000).toFixed(1)}M EGP`;
  }
  if (v >= 1_000) {
    return isAr ? `${(v / 1_000).toFixed(0)} ألف ج.م` : `${(v / 1_000).toFixed(0)}K EGP`;
  }
  return isAr ? `${v} ج.م` : `${v} EGP`;
};

// Helper: Map text to TradeCategory
const inferTradeCategory = (specialization: string): TradeCategory => {
  const s = (specialization || '').toLowerCase();
  if (s.includes('خرسان') || s.includes('إنشائ') || s.includes('civil') || s.includes('concrete') || s.includes('أساس')) {
    return 'civil';
  }
  if (s.includes('كهروميكانيك') || s.includes('كهرب') || s.includes('صحي') || s.includes('mep') || s.includes('حريق')) {
    return 'mep';
  }
  if (s.includes('تكييف') || s.includes('تهوي') || s.includes('hvac') || s.includes('تبريد')) {
    return 'hvac';
  }
  if (s.includes('عزل') || s.includes('waterproof') || s.includes('رطوب') || s.includes('إيبوكسي')) {
    return 'waterproofing';
  }
  if (s.includes('تشطيب') || s.includes('ديكور') || s.includes('رخام') || s.includes('دهان') || s.includes('جبس')) {
    return 'finishes';
  }
  if (s.includes('معدن') || s.includes('حديد') || s.includes('جمالون') || s.includes('steel')) {
    return 'steel';
  }
  if (s.includes('بني') || s.includes('طرق') || s.includes('تراب') || s.includes('infra') || s.includes('شبك')) {
    return 'infrastructure';
  }
  return 'civil';
};

export default function SubcontractorsPortalPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Data states
  const [subcontractors, setSubcontractors] = useState<EnrichedSubcontractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'contracts_desc' | 'value_desc' | 'name_asc'>('rating_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Active detail modal
  const [activeSubModal, setActiveSubModal] = useState<EnrichedSubcontractor | null>(null);

  // Load subcontractors and projects
  const loadPortalData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch projects
      const projs = await ProjectService.getProjects().catch(() => []);
      setProjects(projs || []);

      // 2. Query project subcontractors table
      let fetchedSubs: ProjectSubcontractor[] = [];
      try {
        const { data, error } = await supabase
          .from('project_subcontractors')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          fetchedSubs = data as ProjectSubcontractor[];
        }
      } catch (e) {
        console.warn('Subcontractors direct fetch notice:', e);
      }

      // If empty, check pm_project_subcontractors
      if (fetchedSubs.length === 0) {
        try {
          const { data, error } = await supabase
            .from('pm_project_subcontractors')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            fetchedSubs = data as ProjectSubcontractor[];
          }
        } catch (e) {
          console.warn('pm_project_subcontractors fetch notice:', e);
        }
      }

      // Filter out any synthetic test entries or invalid negative records
      const realSubs = fetchedSubs.filter((sub) => {
        const name = (sub.company_name || '').toLowerCase();
        const val = Number(sub.contract_value || 0);
        return !name.includes('synthetic') && !name.includes('qa-e2e') && val >= 0;
      });

      // Enrich real records with project metadata
      if (realSubs.length > 0) {
        const enriched: EnrichedSubcontractor[] = realSubs.map((sub) => {
          const proj = projs.find((p) => p.id === sub.project_id);
          const spec = sub.specialization || sub.scope_description || '';
          const trade = inferTradeCategory(spec);
          const val = Number(sub.contract_value || 0);

          // Real database rating if recorded, never simulated
          const rawRating = (sub as any).rating;
          const realRating = rawRating != null && !isNaN(Number(rawRating)) ? Number(rawRating) : null;
          let rating_tier: EnrichedSubcontractor['rating_tier'] = 'unrated';
          if (realRating != null) {
            rating_tier =
              realRating >= 4.5
                ? 'exceptional'
                : realRating >= 3.8
                ? 'very_good'
                : realRating >= 3.0
                ? 'standard'
                : 'underperforming';
          }

          // Real achievement percentage if recorded
          const rawProgress = (sub as any).achievement_pct;
          const realProgress = rawProgress != null && !isNaN(Number(rawProgress)) ? Number(rawProgress) : null;
          const isUnderperforming =
            (realRating != null && realRating < 3.0) || (realProgress != null && realProgress < 70);

          const projName = proj
            ? (((proj as { project_name?: string }).project_name || (proj as any).name_ar || (proj as any).name_en) as string)
            : sub.project_id
            ? (isAr ? 'مشروع مسند' : 'Assigned Project')
            : (isAr ? 'غير مسند لمشروع' : 'Unassigned');

          const projCode = proj
            ? (((proj as { project_code?: string }).project_code || (proj as any).code) as string)
            : '';

          return {
            id: sub.id,
            project_id: sub.project_id,
            project_name: projName,
            project_code: projCode,
            company_name: sub.company_name || (isAr ? 'مقاول باطن مسجل' : 'Registered Subcontractor'),
            specialization: spec,
            trade_category: trade,
            scope_description: sub.scope_description || sub.scope_of_work || '',
            contract_value: val,
            status: (sub.status as any) || 'active',
            contract_status:
              sub.contract_status ||
              (sub.status === 'active'
                ? isAr ? 'ساري وموقع' : 'Active'
                : sub.status === 'completed'
                ? isAr ? 'منتهي ومسلّم' : 'Completed'
                : isAr ? 'معلق مؤقتاً' : 'Suspended'),
            rating: realRating,
            rating_tier,
            achievement_pct: realProgress,
            is_underperforming: isUnderperforming,
            active_contracts_count: sub.status === 'active' ? 1 : 0,
            rep_name: sub.rep_name || null,
            rep_phone: sub.rep_phone || null,
            rep_email: sub.rep_email || null,
            start_date: sub.start_date || null,
            end_date: sub.end_date || null,
            notes: sub.notes || null,
          };
        });
        setSubcontractors(enriched);
      } else {
        setSubcontractors([]);
      }
    } catch (err) {
      console.error('Failed to load subcontractors directory:', err);
      toast.error(isAr ? 'فشل تحميل سجل مقاولي الباطن' : 'Failed to load subcontractors');
      setSubcontractors([]);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Filter & Search Logic
  const filteredSubcontractors = useMemo(() => {
    let result = [...subcontractors];

    // Search query filter (company name, trade, rep name, phone, project name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (sub) =>
          (sub.company_name || '').toLowerCase().includes(q) ||
          (sub.specialization || '').toLowerCase().includes(q) ||
          (sub.rep_name || '').toLowerCase().includes(q) ||
          (sub.project_name || '').toLowerCase().includes(q) ||
          (sub.rep_phone || '').includes(q) ||
          (sub.rep_email || '').toLowerCase().includes(q)
      );
    }

    // Trade category filter
    if (selectedTrade !== 'all') {
      result = result.filter((sub) => sub.trade_category === selectedTrade);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((sub) => sub.status === selectedStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating_desc') {
        return (b.rating ?? -1) - (a.rating ?? -1);
      }
      if (sortBy === 'value_desc') {
        return (b.contract_value || 0) - (a.contract_value || 0);
      }
      if (sortBy === 'contracts_desc') {
        return (b.active_contracts_count || 0) - (a.active_contracts_count || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.company_name || '').localeCompare(b.company_name || '', isAr ? 'ar' : 'en');
      }
      return 0;
    });

    return result;
  }, [subcontractors, searchQuery, selectedTrade, selectedStatus, sortBy, isAr]);

  // Aggregate Metrics & KPIs
  const kpis = useMemo(() => {
    const totalCount = subcontractors.length;
    const activeContracts = subcontractors.filter((s) => s.status === 'active').length;
    const totalValue = subcontractors.reduce((sum, s) => sum + (s.contract_value || 0), 0);
    const ratedSubs = subcontractors.filter((s) => s.rating != null && s.rating > 0);
    const avgScore =
      ratedSubs.length > 0
        ? (ratedSubs.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSubs.length).toFixed(1)
        : null;
    const underperformingCount = subcontractors.filter((s) => s.is_underperforming).length;

    return {
      totalCount,
      activeContracts,
      totalValue,
      avgScore,
      underperformingCount,
    };
  }, [subcontractors]);

  // Escape key handler for accessible modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSubModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to render rating stars
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    return (
      <div
        className="flex items-center gap-0.5 text-amber-400"
        aria-label={isAr ? `التقييم: ${rating} من 5 نجوم` : `${rating} out of 5 stars`}
        title={isAr ? `التقييم: ${rating} من 5 نجوم` : `Rating: ${rating} of 5 stars`}
      >
        {[...Array(5)].map((_, i) => {
          const isFilled = i < fullStars;
          const isHalf = i === fullStars && hasHalf;
          return (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          );
        })}
      </div>
    );
  };

  // Helper to render rating badge tier
  const renderRatingTierBadge = (tier?: EnrichedSubcontractor['rating_tier']) => {
    switch (tier) {
      case 'exceptional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'ممتاز (الفئة أ)' : 'Exceptional'}</span>
          </span>
        );
      case 'very_good':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <span>{isAr ? 'جيد جداً (الفئة ب)' : 'Very Good'}</span>
          </span>
        );
      case 'standard':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span>{isAr ? 'قياسي (الفئة ج)' : 'Standard'}</span>
          </span>
        );
      case 'underperforming':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>{isAr ? 'تنبيه تدني الأداء' : 'Action Required'}</span>
          </span>
        );
      case 'unrated':
      default:
        return null;
    }
  };

  // Helper to render trade badge
  const renderTradeBadge = (tradeCat: TradeCategory, customLabel?: string) => {
    const config = TRADE_CONFIGS[tradeCat] || TRADE_CONFIGS.civil;
    const IconComponent = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
      >
        <IconComponent className={`w-3.5 h-3.5 ${config.tone}`} />
        <span>{customLabel || (isAr ? config.nameAr : config.nameEn)}</span>
      </span>
    );
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: EnrichedSubcontractor['status']) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isAr ? 'عقد ساري' : 'Active'}</span>
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <CheckCircle2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>{isAr ? 'مسلّم ومنتهي' : 'Completed'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        <span>{isAr ? 'معلق وموقوف' : 'Suspended'}</span>
      </span>
    );
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-[1750px] w-full mx-auto text-start"
    >
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" label={isAr ? 'لوحة التحكم' : 'Dashboard'} />
          <Breadcrumbs
            items={[
              {
                label: isAr ? 'بوابة مقاولي الباطن' : 'Subcontractors Portal',
                href: '/subcontractors',
                icon: Building2,
              },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href="/contracts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'سجل العقود العام' : 'Contracts Register'}</span>
          </Link>
          <button
            type="button"
            onClick={loadPortalData}
            disabled={loading}
            aria-label={isAr ? 'تحديث السجل' : 'Refresh Register'}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/10 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
              {isAr ? 'بوابة وسجل مقاولي الباطن' : 'Subcontractors Portal & Directory'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? 'الدليل المعتمد لمقاولي الباطن: تخصصات البنود، مؤشرات التقييم والأداء، العقود السارية، ومتابعة المستخلصات'
                : 'Approved subcontractors directory: trade specializations, performance ratings, active contracts & IPC processing'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div
          role="radiogroup"
          aria-label={isAr ? 'نمط العرض' : 'View mode'}
          className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 self-start md:self-auto shrink-0"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'cards'}
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isAr ? 'بطاقات' : 'Cards'}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{isAr ? 'جدول مفصل' : 'Table'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <section
        aria-label={isAr ? 'مؤشرات أداء مقاولي الباطن' : 'Subcontractors KPIs'}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* KPI 1: Total Approved Subs */}
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'إجمالي مقاولي الباطن' : 'Total Subcontractors'}</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {loading ? '…' : kpis.totalCount}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? 'شركة معتمدة' : 'approved'}</span>
          </div>
        </div>

        {/* KPI 2: Active Contracts */}
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'عقود سارية قيد التنفيذ' : 'Active Contracts'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {loading ? '…' : kpis.activeContracts}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? 'مشروع جاري' : 'in progress'}</span>
          </div>
        </div>

        {/* KPI 3: Total Subcontracted Value */}
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'إجمالي القيمة التعاقدية' : 'Total Contract Value'}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums truncate block">
              {loading ? '…' : fmtCompactEGP(kpis.totalValue, isAr)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{isAr ? 'المسند بموجب أوامر إسناد' : 'EGP Total'}</span>
          </div>
        </div>

        {/* KPI 4: Average Score & Compliance */}
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'متوسط تقييم الأداء' : 'Avg Rating Score'}</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Star className="w-4 h-4 fill-purple-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums">
              {loading ? '…' : kpis.avgScore ? `${kpis.avgScore} / 5.0` : (isAr ? 'غير مسجل' : 'N/A')}
            </span>
            {kpis.underperformingCount > 0 && !loading && (
              <span className="text-[10px] font-bold text-rose-500 inline-flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{kpis.underperformingCount} {isAr ? 'إنذار' : 'alerts'}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Controls & Filter Bar */}
      <section
        aria-label={isAr ? 'خيارات البحث والتصفية' : 'Search and filters'}
        className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث باسم المقاول، التخصص، كود المشروع، المهندس المسؤول، أو الهاتف...'
                  : 'Search by subcontractor, trade, project, representative, or phone...'
              }
              className="w-full ps-10 pe-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">{isAr ? 'الحالة:' : 'Status:'}</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                aria-label={isAr ? 'تصفية حسب حالة العقد' : 'Filter by status'}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none transition-colors"
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="active">{isAr ? 'عقود سارية' : 'Active'}</option>
                <option value="suspended">{isAr ? 'معلقة / موقوفة' : 'Suspended'}</option>
                <option value="completed">{isAr ? 'مسلّمة ومنتهية' : 'Completed'}</option>
              </select>
            </div>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">{isAr ? 'ترتيب:' : 'Sort:'}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label={isAr ? 'ترتيب السجلات' : 'Sort records'}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none transition-colors"
              >
                <option value="rating_desc">{isAr ? 'الأعلى تقييماً ★' : 'Highest Rating'}</option>
                <option value="value_desc">{isAr ? 'القيمة التعاقدية (الأكبر)' : 'Highest Value'}</option>
                <option value="contracts_desc">{isAr ? 'العقود السارية' : 'Active Contracts'}</option>
                <option value="name_asc">{isAr ? 'أبجدياً (أ-ي)' : 'Name (A-Z)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trade Specialization Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pb-1 pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 me-1">
            <SlidersHorizontal className="w-3.5 h-3.5 inline-block me-1" />
            {isAr ? 'التخصص الإنشائي:' : 'Trade:'}
          </span>
          {(Object.keys(TRADE_CONFIGS) as TradeCategory[]).map((tradeKey) => {
            const cfg = TRADE_CONFIGS[tradeKey];
            const isSelected = selectedTrade === tradeKey;
            const Icon = cfg.icon;
            return (
              <button
                key={tradeKey}
                type="button"
                onClick={() => setSelectedTrade(tradeKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cfg.tone}`} />
                <span>{isAr ? cfg.nameAr : cfg.nameEn}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Directory Content: Loading, Empty, or Data Views */}
      {loading ? (
        // Skeletons
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="w-20 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-1/2 h-3 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
                <div className="w-full h-8 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-16 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredSubcontractors.length === 0 ? (
        // Empty State
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {subcontractors.length === 0
                ? isAr
                  ? 'لا يوجد مقاولو باطن مسجلون حالياً'
                  : 'No Subcontractors Registered Yet'
                : isAr
                ? 'لم يتم العثور على مقاولي باطن مطابقين'
                : 'No Subcontractors Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {subcontractors.length === 0
                ? isAr
                  ? 'لم يتم تسجيل أو إسناد عقود مقاولي باطن في النظام حتى الآن. تظهر الشركات تلقائياً بمجرد إضافتها للمشاريع.'
                  : 'No subcontractor contracts have been assigned yet. Subcontractors will appear here as soon as they are linked to projects.'
                : isAr
                ? 'جرب تعديل كلمات البحث، أو اختيار تخصص إنشائي آخر، أو إزالة قيود الحالة المحددة.'
                : 'Try adjusting search keywords, selecting another trade, or clearing filters.'}
            </p>
          </div>
          {subcontractors.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTrade('all');
                setSelectedStatus('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط كل التصفية' : 'Reset All Filters'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        // =====================================================================
        // CARDS VIEW
        // =====================================================================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubcontractors.map((sub) => (
            <div
              key={sub.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {renderStatusBadge(sub.status)}
                    {sub.rating_tier && sub.rating_tier !== 'unrated' && renderRatingTierBadge(sub.rating_tier)}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {sub.company_name}
                  </h3>
                  {sub.rating != null ? (
                    <div className="mt-1 flex items-center gap-2">
                      {renderRatingStars(sub.rating)}
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {sub.rating.toFixed(1)}
                      </span>
                      {sub.achievement_pct != null && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          ({sub.achievement_pct}% {isAr ? 'إنجاز' : 'progress'})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'بدون تقييم مسجل' : 'No rating recorded'}
                    </div>
                  )}
                </div>

                {/* Trade Specialization Tag */}
                {sub.specialization ? (
                  <div>{renderTradeBadge(sub.trade_category, sub.specialization)}</div>
                ) : null}

                {/* Scope Description */}
                {sub.scope_description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sub.scope_description}
                  </p>
                ) : null}

                {/* Active Contract Link & Project Badge */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'المشروع المرتبط:' : 'Linked Project:'}</span>
                    {sub.project_id ? (
                      <Link
                        href={`/projects/${sub.project_id}`}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 truncate max-w-[180px] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
                        title={sub.project_name}
                      >
                        <span className="truncate">{sub.project_name}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">{isAr ? 'غير مسند' : 'Unassigned'}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'قيمة العقد:' : 'Contract Value:'}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {fmtEGP(sub.contract_value)} {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>

                {/* Representative Contact Snippet */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                  {sub.rep_name ? (
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={sub.rep_name}>
                      <HardHat className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate text-[11px] font-semibold">{sub.rep_name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{isAr ? 'الممثل غير محدد' : 'Representative not set'}</span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {sub.rep_phone && (
                      <a
                        href={`tel:${sub.rep_phone}`}
                        aria-label={`${isAr ? 'اتصال بهاتف' : 'Call'} ${sub.rep_name || sub.company_name}`}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        title={sub.rep_phone}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {sub.rep_email && (
                      <a
                        href={`mailto:${sub.rep_email}`}
                        aria-label={`${isAr ? 'إرسال بريد إلكتروني إلى' : 'Email'} ${sub.rep_name || sub.company_name}`}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        title={sub.rep_email}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(sub)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'تفاصيل السجل' : 'View Profile'}</span>
                </button>

                {sub.project_id && (
                  <Link
                    href={`/projects/${sub.project_id}?tab=team`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                    title={isAr ? 'فتح العقد في تبويب الفريق' : 'Open in Project Team tab'}
                  >
                    <span>{isAr ? 'العقد' : 'Contract'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // =====================================================================
        // ACCESSIBLE TABLE VIEW
        // =====================================================================
        <div
          role="region"
          aria-label={isAr ? 'سجل مقاولي الباطن المعتمدين' : 'Subcontractors Register'}
          tabIndex={0}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse min-w-[900px]">
              <caption className="sr-only">
                {isAr
                  ? 'سجل مقاولي الباطن: يوضح اسم الشركة، التخصص، تقييم الأداء، المشروع المرتبط، القيمة التعاقدية، وجهات الاتصال'
                  : 'Subcontractors registry showing company name, trade specialization, rating, linked project, contract value, and contacts'}
              </caption>
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                  <th scope="col" className="p-3.5 text-center w-12">#</th>
                  <th scope="col" className="p-3.5 text-start">{isAr ? 'المقاول والشركة' : 'Subcontractor'}</th>
                  <th scope="col" className="p-3.5 text-start">{isAr ? 'التخصص الإنشائي' : 'Trade Specialization'}</th>
                  <th scope="col" className="p-3.5 text-start">{isAr ? 'المشروع المرتبط' : 'Active Contract Link'}</th>
                  <th scope="col" className="p-3.5 text-center">{isAr ? 'التقييم ومعدل الإنجاز' : 'Rating & Progress'}</th>
                  <th scope="col" className="p-3.5 text-end">{isAr ? 'قيمة العقد (ج.م)' : 'Contract Value (EGP)'}</th>
                  <th scope="col" className="p-3.5 text-center">{isAr ? 'حالة العقد' : 'Status'}</th>
                  <th scope="col" className="p-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredSubcontractors.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Index */}
                    <td className="p-3.5 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px] tabular-nums">
                      {idx + 1}
                    </td>

                    {/* Company & Representative */}
                    <th scope="row" className="p-3.5 text-start font-normal whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{sub.company_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal ps-6 flex items-center gap-2 mt-0.5">
                        <span>{sub.rep_name || (isAr ? 'الممثل غير محدد' : 'Not specified')}</span>
                        {sub.rep_phone && (
                          <>
                            <span>•</span>
                            <a
                              href={`tel:${sub.rep_phone}`}
                              className="hover:underline font-mono text-slate-500 dark:text-slate-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded px-0.5"
                            >
                              {sub.rep_phone}
                            </a>
                          </>
                        )}
                      </div>
                    </th>

                    {/* Trade Specialization */}
                    <td className="p-3.5 text-start max-w-xs">
                      {sub.specialization ? (
                        <div>{renderTradeBadge(sub.trade_category, sub.specialization)}</div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                      )}
                      {sub.scope_description && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                          {sub.scope_description}
                        </div>
                      )}
                    </td>

                    {/* Active Contract Link */}
                    <td className="p-3.5 text-start">
                      {sub.project_id ? (
                        <>
                          <Link
                            href={`/projects/${sub.project_id}`}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 max-w-[200px] truncate cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
                            title={sub.project_name}
                          >
                            <span className="truncate">{sub.project_name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          </Link>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {sub.project_code ? `${sub.project_code} • ` : ''}{sub.contract_status}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">{isAr ? 'غير مسند' : 'Unassigned'}</span>
                      )}
                    </td>

                    {/* Rating & Performance Indicator */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {sub.rating != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            {renderRatingStars(sub.rating)}
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                              {sub.rating.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {sub.rating_tier && sub.rating_tier !== 'unrated' && renderRatingTierBadge(sub.rating_tier)}
                            {sub.achievement_pct != null && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {sub.achievement_pct}%
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">{isAr ? 'غير مقيّم' : 'Unrated'}</span>
                      )}
                    </td>

                    {/* Contract Value */}
                    <td className="p-3.5 text-end font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                      {fmtEGP(sub.contract_value)}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {renderStatusBadge(sub.status)}
                    </td>

                    {/* Accessible Action Buttons */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveSubModal(sub)}
                          aria-label={`${isAr ? 'عرض تفاصيل' : 'View details of'} ${sub.company_name}`}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                          title={isAr ? 'تفاصيل السجل' : 'View Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {sub.project_id && (
                          <Link
                            href={`/projects/${sub.project_id}?tab=team`}
                            aria-label={`${isAr ? 'فتح العقد في مشروع' : 'Open contract in'} ${sub.project_name}`}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            title={isAr ? 'فتح العقد' : 'Open Contract'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accessible Subcontractor Detail Modal / Drawer */}
      {activeSubModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sub-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-start">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="modal-sub-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    {activeSubModal.company_name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'بطاقة المقاول المعتمد وسجل الأداء والتقييم' : 'Subcontractor verification profile'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubModal(null)}
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Specialization & Badges */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {renderTradeBadge(activeSubModal.trade_category, activeSubModal.specialization)}
                  {renderStatusBadge(activeSubModal.status)}
                </div>
                <div className="flex items-center gap-2">
                  {activeSubModal.rating_tier && activeSubModal.rating_tier !== 'unrated' && renderRatingTierBadge(activeSubModal.rating_tier)}
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {activeSubModal.rating != null ? `${activeSubModal.rating.toFixed(1)} / 5.0` : (isAr ? 'غير مقيّم' : 'Unrated')}
                  </span>
                </div>
              </div>

              {/* Performance Indicator Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'معدل الإنجاز' : 'Progress'}</div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {activeSubModal.achievement_pct != null ? `${activeSubModal.achievement_pct}%` : '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'عقود نشطة' : 'Active Contracts'}</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {activeSubModal.active_contracts_count}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'القيمة التعاقدية' : 'Contract Value'}</div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    {fmtCompactEGP(activeSubModal.contract_value, isAr)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'حالة التنبيه' : 'Alert Status'}</div>
                  <div className="text-xs font-bold mt-1">
                    {activeSubModal.is_underperforming ? (
                      <span className="text-rose-500">{isAr ? 'تنبيه أداء' : 'Alert'}</span>
                    ) : activeSubModal.rating != null || activeSubModal.achievement_pct != null ? (
                      <span className="text-emerald-500">{isAr ? 'أداء مطابق' : 'On Track'}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">{isAr ? 'غير مقيّم' : 'Unrated'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scope of Work */}
              {activeSubModal.scope_description && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'نطاق الأعمال المسند:' : 'Assigned Scope of Work:'}</span>
                  </h4>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-600 dark:text-slate-300">
                    {activeSubModal.scope_description}
                  </p>
                </div>
              )}

              {/* Representative & Contacts Card */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-cyan-500" />
                  <span>{isAr ? 'الممثل المعتمد وبيانات التواصل:' : 'Authorized Representative:'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'الاسم المسؤول' : 'Name'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeSubModal.rep_name || (isAr ? 'غير محدد' : 'Not specified')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'الهاتف المباشر' : 'Phone'}</span>
                    {activeSubModal.rep_phone ? (
                      <a
                        href={`tel:${activeSubModal.rep_phone}`}
                        className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded px-0.5"
                      >
                        {activeSubModal.rep_phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                    {activeSubModal.rep_email ? (
                      <a
                        href={`mailto:${activeSubModal.rep_email}`}
                        className="font-mono text-sky-600 dark:text-sky-400 hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded px-0.5"
                      >
                        {activeSubModal.rep_email}
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quality & Site Feedback Note */}
              {activeSubModal.notes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isAr ? 'ملاحظة تقرير الموقع ومكتب الفني:' : 'Site & QC Notes:'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    {activeSubModal.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              {activeSubModal.project_id ? (
                <Link
                  href={`/projects/${activeSubModal.project_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
                >
                  <span>{isAr ? 'فتح مساحة عمل المشروع' : 'Open Project Workspace'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                {activeSubModal.project_id && (
                  <Link
                    href={`/projects/${activeSubModal.project_id}?tab=team`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إدارة بنود العقد' : 'Manage Contract'}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
