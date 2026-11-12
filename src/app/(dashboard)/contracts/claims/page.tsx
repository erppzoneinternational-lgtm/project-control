'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';
import { useLanguage } from '@/contexts/LanguageContext';
import { contractsService } from '@/lib/services/contracts.service';
import { calculateContractualIpc } from '@/lib/planning/calculations';
import { ProjectService } from '@/lib/services/project.service';
import {
  Contract,
  Claim,
  VariationOrder,
  EOTRequest,
  IPCCertificate,
  ContractSummary,
  ClaimStatus,
  ClaimType,
  ContractStatus
} from '@/types/contracts';
import { toast } from 'sonner';
import {
  FileText,
  FileWarning,
  Clock,
  CreditCard,
  Plus,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
  LayoutGrid,
  List,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Eye,
  ShieldAlert,
  Check,
  Layers,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const ALLOWED_ROLES = ['admin', 'project_manager', 'commercial_manager', 'contract_admin', 'coo'];

type TabKey = 'contracts' | 'claims' | 'vos' | 'eots' | 'ipcs';
type ViewMode = 'table' | 'kanban' | 'timeline';
type DisputePriority = 'critical' | 'high' | 'medium' | 'low';

// Currency & number formatting
const formatEGP = (val: number, compact = false, isRTL = true) => {
  const num = Number(val || 0);
  if (compact && Math.abs(num) >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(2);
    return isRTL ? `${formatted} مليون ج.م` : `${formatted}M EGP`;
  }
  return isRTL ? `${num.toLocaleString('en-US')} ج.م` : `${num.toLocaleString('en-US')} EGP`;
};

const formatDate = (dateStr: string | null | undefined, isRTL: boolean) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isRTL ? d.toLocaleDateString('ar-EG') : d.toLocaleDateString('en-US');
  } catch {
    return dateStr;
  }
};

// Dispute priority calculator for Claims
const getClaimPriority = (claim: Claim): {
  priority: DisputePriority;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  icon: typeof AlertTriangle;
} => {
  const amount = Number(claim.claimed_amount || 0);
  if (claim.status === 'rejected' || amount >= 1_000_000) {
    return {
      priority: 'critical',
      labelAr: 'نزاع تعاقدي حرج',
      labelEn: 'Critical Dispute',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      icon: AlertTriangle
    };
  }
  if (claim.status === 'under_review' || amount >= 250_000) {
    return {
      priority: 'high',
      labelAr: 'أولوية مرتفعة - مخاطر انقضاء المهلة',
      labelEn: 'High Priority (Time-bar Risk)',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: Clock
    };
  }
  if (claim.status === 'submitted') {
    return {
      priority: 'medium',
      labelAr: 'أولوية متوسطة',
      labelEn: 'Medium Priority',
      badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
      icon: FileText
    };
  }
  return {
    priority: 'low',
    labelAr: 'أولوية اعتيادية',
    labelEn: 'Routine',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    icon: CheckCircle2
  };
};

// Dispute priority for Variation Orders
const getVOPriority = (vo: VariationOrder): {
  priority: DisputePriority;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  icon: typeof AlertTriangle;
} => {
  const cost = Math.abs(Number(vo.cost_impact || 0));
  const days = Number(vo.time_impact_days || 0);
  if (vo.status === 'rejected' || cost >= 1_000_000 || days >= 30) {
    return {
      priority: 'critical',
      labelAr: 'أثر تعاقدي حرج',
      labelEn: 'Critical Contract Impact',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      icon: AlertTriangle
    };
  }
  if (vo.status === 'under_review' || cost >= 200_000 || days >= 14) {
    return {
      priority: 'high',
      labelAr: 'أولوية مرتفعة',
      labelEn: 'High Priority',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: Clock
    };
  }
  return {
    priority: 'medium',
    labelAr: 'تغيير هندسي اعتيادي',
    labelEn: 'Standard Variation',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2
  };
};

const getStatusBadge = (status: string, isRTL = true) => {
  const config: Record<string, { bg: string; text: string; labelAr: string; labelEn: string }> = {
    active: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'ساري', labelEn: 'Active' },
    suspended: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', labelAr: 'موقوف', labelEn: 'Suspended' },
    completed: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', labelAr: 'مكتمل', labelEn: 'Completed' },
    terminated: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', labelAr: 'منهي', labelEn: 'Terminated' },
    draft: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400', labelAr: 'مسودة', labelEn: 'Draft' },
    submitted: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-700 dark:text-sky-400', labelAr: 'تم التقديم', labelEn: 'Submitted' },
    under_review: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', labelAr: 'قيد التقييم الفني', labelEn: 'Under Review' },
    approved: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'معتمد', labelEn: 'Approved' },
    rejected: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', labelAr: 'مرفوض', labelEn: 'Rejected' },
    closed: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', labelAr: 'مغلق', labelEn: 'Closed' },
    certified: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'معتمد للصرف', labelEn: 'Certified' },
    paid: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', labelAr: 'تم الصرف', labelEn: 'Paid' },
  };
  const c = config[status] || { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', labelAr: status, labelEn: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-transparent ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
      {isRTL ? c.labelAr : c.labelEn}
    </span>
  );
};

export default function ContractsAndClaimsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const projectParam = searchParams.get('projectId') || searchParams.get('project_id');
  const { user } = useAuth();
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [projects, setProjects] = useState<any[]>([]);
  const { roles: userRoles, isAdmin, hasAnyRole } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const { t, locale } = useLanguage();
  const isRTL = locale === 'ar';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || projectParam || '');

  // 1. Two-way sync: activeProjectId from store -> selectedProjectId
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // 2. Two-way sync: selectedProjectId -> store activeProjectId
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProjectId && setActiveProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId, activeProjectId, setActiveProjectId]);

  // 3. URL search params synchronization
  useEffect(() => {
    if (projectParam && projectParam !== selectedProjectId) {
      setSelectedProjectId(projectParam);
      if (setActiveProjectId) {
        setActiveProjectId(projectParam);
      }
    }
  }, [projectParam]);

  const effectiveProjectId = selectedProjectId || activeProjectId;

  const [activeTab, setActiveTab] = useState<TabKey>('contracts');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [vos, setVos] = useState<VariationOrder[]>([]);
  const [eots, setEots] = useState<EOTRequest[]>([]);
  const [ipcs, setIpcs] = useState<IPCCertificate[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: TabKey;
    data: ItemData;
  } | null>(null);

  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canAccess =
    canAccessPath('/contracts/claims', userRoles || [], isAdmin, dbAccessRules) ||
    canAccessPath('/contracts', userRoles || [], isAdmin, dbAccessRules) ||
    hasAnyRole(ALLOWED_ROLES);
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/contracts', userRoles || [], isAdmin, dbAccessRules) ||
      canEditPath('/contracts/claims', userRoles || [], isAdmin, dbAccessRules));

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam) {
      const normalized = tabParam.toLowerCase();
      if (['contracts', 'claims', 'vos', 'eots', 'ipcs'].includes(normalized)) {
        setActiveTab(normalized as TabKey);
      } else if (normalized === 'eot') {
        setActiveTab('eots');
      } else if (normalized === 'vo') {
        setActiveTab('vos');
      } else if (normalized === 'ipc') {
        setActiveTab('ipcs');
      }
    }
  }, [tabParam]);

  // Adjust default view mode when switching tabs (Kanban/Timeline only for claims & vos)
  useEffect(() => {
    if (activeTab !== 'claims' && activeTab !== 'vos' && viewMode !== 'table') {
      setViewMode('table');
    }
  }, [activeTab, viewMode]);

  useEffect(() => {
    ProjectService.getProjects()
      .then((list) => setProjects(list || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (effectiveProjectId && canAccess) {
      loadData(effectiveProjectId);
    }
  }, [effectiveProjectId, canAccess]);

  const loadData = async (targetProjectId?: string, isSilent = false) => {
    const projId = targetProjectId || effectiveProjectId;
    if (!projId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        contractsData,
        claimsData,
        vosData,
        eotsData,
        ipcsData,
        summaryData
      ] = await Promise.all([
        contractsService.getContracts(projId),
        contractsService.getClaims(projId),
        contractsService.getVariationOrders(projId),
        contractsService.getEOTRequests(projId),
        contractsService.getIPCCertificates(projId),
        contractsService.getContractSummary(projId)
      ]);
      setContracts(contractsData);
      setClaims(claimsData);
      setVos(vosData);
      setEots(eotsData);
      setIpcs(ipcsData);
      setSummary(summaryData);
    } catch (error: unknown) {
      toast.error(isRTL ? 'حدث خطأ أثناء تحميل البيانات التعاقدية' : 'Error loading contractual data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; labelAr: string; labelEn: string }> = {
      active: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'ساري', labelEn: 'Active' },
      suspended: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', labelAr: 'موقوف', labelEn: 'Suspended' },
      completed: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', labelAr: 'مكتمل', labelEn: 'Completed' },
      terminated: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', labelAr: 'منهي', labelEn: 'Terminated' },
      draft: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400', labelAr: 'مسودة', labelEn: 'Draft' },
      submitted: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-700 dark:text-sky-400', labelAr: 'تم التقديم', labelEn: 'Submitted' },
      under_review: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', labelAr: 'قيد التقييم الفني', labelEn: 'Under Review' },
      approved: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'معتمد', labelEn: 'Approved' },
      rejected: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', labelAr: 'مرفوض', labelEn: 'Rejected' },
      closed: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', labelAr: 'مغلق', labelEn: 'Closed' },
      certified: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', labelAr: 'معتمد للصرف', labelEn: 'Certified' },
      paid: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', labelAr: 'تم الصرف', labelEn: 'Paid' },
    };
    const c = config[status] || { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', labelAr: status, labelEn: status };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-transparent ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
        {isRTL ? c.labelAr : c.labelEn}
      </span>
    );
  };

  // Filtered dataset according to search and status
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchSearch =
        c.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.clause_reference && c.clause_reference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const priority = getClaimPriority(c).priority;
      const matchPriority = priorityFilter === 'all' || priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [claims, searchQuery, statusFilter, priorityFilter]);

  const filteredVOs = useMemo(() => {
    return vos.filter((v) => {
      const matchSearch =
        v.vo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vo_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const priority = getVOPriority(v).priority;
      const matchPriority = priorityFilter === 'all' || priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [vos, searchQuery, statusFilter, priorityFilter]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title_ar.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchQuery, statusFilter]);

  const filteredEOTs = useMemo(() => {
    return eots.filter((e) => {
      const matchSearch =
        e.eot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.clause_reference && e.clause_reference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [eots, searchQuery, statusFilter]);

  const filteredIPCs = useMemo(() => {
    return ipcs.filter((i) => {
      const matchSearch = String(i.ipc_number).includes(searchQuery);
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [ipcs, searchQuery, statusFilter]);

  if (!canAccess) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">صلاحيات غير كافية</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ليس لديك صلاحية للوصول إلى إدارة العقود والمطالبات. يرجى مراجعة مدير النظام.
        </p>
      </div>
    );
  }

  if (!effectiveProjectId) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isRTL ? 'الرجاء تحديد مشروع أولاً' : 'Please Select a Project'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? 'اختر مشروعاً من القائمة أدناه لعرض ومتابعة السجلات التعاقدية والمطالبات وأوامر التغيير.'
              : 'Choose a project below to view and track contractual records, claims, and variations.'}
          </p>
        </div>
        {projects && projects.length > 0 && (
          <div className="pt-2 text-start">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {isRTL ? 'المشاريع المتاحة:' : 'Available Projects:'}
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedProjectId(e.target.value);
                  if (setActiveProjectId) setActiveProjectId(e.target.value);
                }
              }}
              defaultValue=""
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{isRTL ? '-- اختر مشروعاً للبدء --' : '-- Choose Project --'}</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p.name || p.name_ar || p.title_ar || p.title || p.code || p.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-[1750px] mx-auto space-y-6 text-start"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/25">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white ${isRTL ? 'tracking-normal' : 'tracking-tight'}`}>
                  {isRTL ? 'العقود والمطالبات وأوامر التغيير' : 'Contracts, Claims & Variations'}
                </h1>
                {effectiveProjectId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {isRTL ? 'نظام الحوكمة التعاقدية' : 'Contract Governance'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL
                  ? 'إدارة وحوكمة المطالبات التعاقدية وأوامر التغيير وشهادات الدفع وفق شروط الفيديك القياسية'
                  : 'FIDIC Claim Administration (Cl. 20), Variations (Cl. 13) & Interim Payment Governance'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Project Selector dropdown in header for seamless two-way sync */}
          {projects && projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Layers className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={effectiveProjectId || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProjectId(newId);
                  if (setActiveProjectId) {
                    setActiveProjectId(newId);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
                aria-label={isRTL ? 'اختيار المشروع' : 'Select Project'}
              >
                <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{isRTL ? '-- اختر المشروع --' : '-- Select Project --'}</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {p.name || p.name_ar || p.title_ar || p.title || p.code || p.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadData(effectiveProjectId, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none cursor-pointer"
            aria-label={isRTL ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none cursor-pointer"
              aria-haspopup="dialog"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeTab === 'contracts' && (isRTL ? 'إضافة عقد جديد' : 'New Contract')}
                {activeTab === 'claims' && (isRTL ? 'تقديم مطالبة جديدة' : 'Submit Claim')}
                {activeTab === 'vos' && (isRTL ? 'إصدار أمر تغيير' : 'Issue Variation')}
                {activeTab === 'eots' && (isRTL ? 'طلب تمديد مدة' : 'Request EOT')}
                {activeTab === 'ipcs' && (isRTL ? 'إصدار شهادة دفع' : 'New IPC')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="h-7 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Original Value */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRTL ? 'القيمة الأصلية للعقود' : 'Original Contract Value'}
              </span>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 transition-transform">
                <FileSignature className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatEGP(summary?.totalOriginalValue || 0, true, isRTL)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>
                  {contracts.length} {isRTL ? 'عقود مسجلة' : 'Registered Contracts'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Variations */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRTL ? 'أوامر التغيير المعتمدة' : 'Approved Variations'}
              </span>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                + {formatEGP(summary?.totalVOs || 0, true, isRTL)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>
                  {vos.filter((v) => v.status === 'approved').length} {isRTL ? 'أمر معتمد رسمياً' : 'Official VOs'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Claims */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRTL ? 'المطالبات المعتمدة' : 'Approved Claims'}
              </span>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50 group-hover:scale-105 transition-transform">
                <FileWarning className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                + {formatEGP(summary?.totalClaims || 0, true, isRTL)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>
                  {claims.filter((c) => c.status === 'under_review').length}{' '}
                  {isRTL ? 'مطالبات قيد التقييم الفني' : 'Under Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Net Value */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRTL ? 'صافي القيمة التعاقدية الحالية' : 'Net Current Contract Value'}
              </span>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-900/50 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums tracking-tight">
                {formatEGP(summary?.netContractValue || 0, true, isRTL)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                <span>{isRTL ? 'العقد الأصلي + أوامر التغيير + المطالبات المعتمدة' : 'Original + VOs + Claims'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6">
          <nav
            className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar"
            aria-label="Contract Management Tabs"
            role="tablist"
          >
            {[
              { id: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', count: contracts.length, icon: FileSignature },
              { id: 'claims', labelAr: 'المطالبات التعاقدية', labelEn: 'Claims', count: claims.length, icon: FileWarning },
              { id: 'vos', labelAr: 'أوامر التغيير', labelEn: 'Variation Orders', count: vos.length, icon: TrendingUp },
              { id: 'eots', labelAr: 'تمديد المدة', labelEn: 'EOT Requests', count: eots.length, icon: Clock },
              { id: 'ipcs', labelAr: 'شهادات الدفع', labelEn: 'IPC Certificates', count: ipcs.length, icon: CreditCard },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as TabKey);
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{isRTL ? tab.labelAr : tab.labelEn}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold ${
                      active
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Toolbar: Search, Filters, and View Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'contracts'
                  ? isRTL ? 'البحث برقم العقد أو المقاول...' : 'Search contracts or contractor...'
                  : activeTab === 'claims'
                  ? isRTL ? 'البحث برقم المطالبة أو العنوان أو البند...' : 'Search claim number, title, clause...'
                  : activeTab === 'vos'
                  ? isRTL ? 'البحث برقم الأمر أو العنوان...' : 'Search VO number or title...'
                  : isRTL ? 'بحث سريع...' : 'Quick search...'
              }
              className="w-full ps-9 pe-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'كافة الحالات' : 'All Statuses'}</option>
                <option value="draft" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'مسودة' : 'Draft'}</option>
                <option value="submitted" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'تم التقديم' : 'Submitted'}</option>
                <option value="under_review" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'قيد المراجعة' : 'Under Review'}</option>
                <option value="approved" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'معتمد' : 'Approved'}</option>
                <option value="rejected" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'مرفوض' : 'Rejected'}</option>
                <option value="closed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'مغلق' : 'Closed'}</option>
              </select>
            </div>

            {/* Dispute Priority Filter (For Claims & VOs) */}
            {(activeTab === 'claims' || activeTab === 'vos') && (
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'كافة مستويات الأولوية' : 'All Priorities'}</option>
                <option value="critical" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'نزاع تعاقدي حرج' : 'Critical'}</option>
                <option value="high" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'أولوية مرتفعة' : 'High'}</option>
                <option value="medium" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'أولوية متوسطة' : 'Medium'}</option>
                <option value="low" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'أولوية اعتيادية' : 'Low'}</option>
              </select>
            )}

            {/* View Mode Switcher (For Claims & VOs) */}
            {(activeTab === 'claims' || activeTab === 'vos') && (
              <div
                className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl"
                role="group"
                aria-label="View Mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  title={isRTL ? 'عرض الجدول' : 'Table View'}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRTL ? 'جدول' : 'Table'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  aria-pressed={viewMode === 'kanban'}
                  title={isRTL ? 'لوحة كانبان' : 'Kanban Board'}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRTL ? 'كانبان' : 'Kanban'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  aria-pressed={viewMode === 'timeline'}
                  title={isRTL ? 'سجل تتبع زمني' : 'Timeline'}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRTL ? 'زمني' : 'Timeline'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area with Skeletons */}
        <div className="p-4 sm:p-6" role="tabpanel" id={`panel-${activeTab}`}>
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse flex items-center justify-between px-6"
                >
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* TAB 1: CONTRACTS */}
              {activeTab === 'contracts' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? '# رقم العقد' : '# Contract No.'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'عنوان العقد' : 'Contract Title'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المقاول / الطرف الثاني' : 'Contractor / 2nd Party'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'القيمة الأصلية' : 'Original Value'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الدفعة المقدمة / الضمان' : 'Advance / Retention'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المدة التعاقدية' : 'Contract Duration'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الحالة' : 'Status'}</th>
                        <th className="px-5 py-3.5 text-end font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredContracts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                            <FileSignature className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                            <p className="font-semibold">{isRTL ? 'لا توجد عقود مسجلة تطابق البحث' : 'No matching contracts found'}</p>
                          </td>
                        </tr>
                      ) : (
                        filteredContracts.map((c) => (
                          <tr
                            key={c.id}
                            tabIndex={0}
                            onClick={() => setSelectedItem({ type: 'contracts', data: c })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedItem({ type: 'contracts', data: c });
                              }
                            }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-none"
                          >
                            <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {c.contract_number}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                              {c.title_ar}
                              {c.fidic_type && (
                                <span className="ms-2 inline-block px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {c.fidic_type}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{c.contractor_name}</td>
                            <td className="px-5 py-4 font-bold tabular-nums text-slate-900 dark:text-white">
                              {formatEGP(c.original_value, false, isRTL)}
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs">
                              {isRTL
                                ? `دفعة مقدمة: ${c.advance_payment_pct || 0}٪ | حجز ضمان: ${c.retention_pct || 0}٪`
                                : `Advance: ${c.advance_payment_pct || 0}% | Retention: ${c.retention_pct || 0}%`}
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                              {formatDate(c.start_date, isRTL)} — {formatDate(c.end_date, isRTL)}
                            </td>
                            <td className="px-5 py-4">{getStatusBadge(c.status)}</td>
                            <td className="px-5 py-4 text-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem({ type: 'contracts', data: c });
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: CLAIMS */}
              {activeTab === 'claims' && (
                <>
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50">
                          <tr>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? '# رقم المطالبة' : '# Claim No.'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'موضوع المطالبة والسند' : 'Claim Title & Basis'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'أولوية النزاع' : 'Dispute Priority'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المبلغ المطالب به' : 'Claimed Amount'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر المعتمد رسمياً' : 'Approved Impact'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'تاريخ التقديم' : 'Submission Date'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'حالة المطالبة' : 'Status'}</th>
                            <th className="px-5 py-3.5 text-end font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'إجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredClaims.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                <FileWarning className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                <p className="font-semibold">{isRTL ? 'لا توجد مطالبات تطابق البحث الحالي' : 'No claims found'}</p>
                              </td>
                            </tr>
                          ) : (
                            filteredClaims.map((c) => {
                              const priorityInfo = getClaimPriority(c);
                              const PriorityIcon = priorityInfo.icon;
                              const variancePct =
                                c.approved_amount && c.claimed_amount
                                  ? Math.round((c.approved_amount / c.claimed_amount) * 100)
                                  : null;

                              return (
                                <tr
                                  key={c.id}
                                  tabIndex={0}
                                  onClick={() => setSelectedItem({ type: 'claims', data: c })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setSelectedItem({ type: 'claims', data: c });
                                    }
                                  }}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-none"
                                >
                                  <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {c.claim_number}
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="font-semibold text-slate-900 dark:text-white">{c.title_ar}</div>
                                    {c.clause_reference && (
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {isRTL ? `السند التعاقدي: ${c.clause_reference}` : `Clause Ref: ${c.clause_reference}`}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityInfo.badgeClass}`}
                                    >
                                      <PriorityIcon className="w-3.5 h-3.5" />
                                      {isRTL ? priorityInfo.labelAr : priorityInfo.labelEn}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 font-black tabular-nums text-slate-900 dark:text-white">
                                    {formatEGP(c.claimed_amount, false, isRTL)}
                                  </td>
                                  <td className="px-5 py-4">
                                    {c.approved_amount !== null && c.approved_amount !== undefined ? (
                                      <div className="space-y-0.5">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                          {formatEGP(c.approved_amount, false, isRTL)}
                                        </span>
                                        {variancePct !== null && (
                                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            {isRTL ? `نسبة الاعتماد ${variancePct}٪` : `Approved ${variancePct}%`}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {isRTL ? 'قيد التقييم والدراسة' : 'Under Review'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                                    {formatDate(c.submission_date, isRTL)}
                                  </td>
                                  <td className="px-5 py-4">{getStatusBadge(c.status)}</td>
                                  <td className="px-5 py-4 text-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItem({ type: 'claims', data: c });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                      title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Claims Kanban View */}
                  {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'submitted', titleAr: 'تم التقديم', titleEn: 'Submitted', headerBg: 'border-t-4 border-t-sky-500' },
                        { id: 'under_review', titleAr: 'قيد التقييم الفني', titleEn: 'Under Review', headerBg: 'border-t-4 border-t-amber-500' },
                        { id: 'approved', titleAr: 'معتمد رسمياً', titleEn: 'Approved', headerBg: 'border-t-4 border-t-emerald-500' },
                        { id: 'rejected', titleAr: 'مرفوض / محل نزاع', titleEn: 'Disputed / Rejected', headerBg: 'border-t-4 border-t-rose-500' },
                      ].map((col) => {
                        const colClaims = filteredClaims.filter((c) => c.status === col.id);
                        return (
                          <div
                            key={col.id}
                            className={`bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 ${col.headerBg}`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                {isRTL ? col.titleAr : col.titleEn}
                              </h3>
                              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {colClaims.length}
                              </span>
                            </div>

                            <div className="space-y-3 min-h-[150px]">
                              {colClaims.length === 0 ? (
                                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                                  {isRTL ? 'لا توجد مطالبات في هذه المرحلة' : 'No claims in this phase'}
                                </div>
                              ) : (
                                colClaims.map((c) => {
                                  const pInfo = getClaimPriority(c);
                                  return (
                                    <div
                                      key={c.id}
                                      tabIndex={0}
                                      role="button"
                                      onClick={() => setSelectedItem({ type: 'claims', data: c })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          setSelectedItem({ type: 'claims', data: c });
                                        }
                                      }}
                                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer space-y-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                          {c.claim_number}
                                        </span>
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pInfo.badgeClass}`}
                                        >
                                          {isRTL ? pInfo.labelAr : pInfo.labelEn}
                                        </span>
                                      </div>

                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                        {c.title_ar}
                                      </h4>

                                      {/* Financial impact badges */}
                                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'المبلغ المطالب به:' : 'Claimed:'}</span>
                                          <span className="font-black tabular-nums text-slate-900 dark:text-white">
                                            {formatEGP(c.claimed_amount, false, isRTL)}
                                          </span>
                                        </div>
                                        {c.approved_amount !== null && (
                                          <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-800 pt-1">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{isRTL ? 'المبلغ المعتمد:' : 'Approved:'}</span>
                                            <span className="font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                                              {formatEGP(c.approved_amount, false, isRTL)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                                        <span>{formatDate(c.submission_date, isRTL)}</span>
                                        {c.clause_reference && (
                                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                                            {c.clause_reference}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Claims Timeline View */}
                  {viewMode === 'timeline' && (
                    <div className="relative border-s-2 border-blue-500/30 ms-4 sm:ms-8 space-y-6 py-2">
                      {filteredClaims.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                          {isRTL ? 'لا توجد مطالبات لتسجيل الجدول الزمني' : 'No claims found'}
                        </div>
                      ) : (
                        filteredClaims.map((c) => {
                          const pInfo = getClaimPriority(c);
                          const PriorityIcon = pInfo.icon;
                          return (
                            <div key={c.id} className="relative ps-6 sm:ps-8">
                              {/* Timeline Node dot */}
                              <div className="absolute -start-[11px] top-1.5 w-5 h-5 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow" />

                              <div
                                tabIndex={0}
                                role="button"
                                onClick={() => setSelectedItem({ type: 'claims', data: c })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setSelectedItem({ type: 'claims', data: c });
                                  }
                                }}
                                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                                      {c.claim_number}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                      {isRTL ? `تاريخ التقديم: ${formatDate(c.submission_date, isRTL)}` : `Submission Date: ${formatDate(c.submission_date, isRTL)}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${pInfo.badgeClass}`}
                                    >
                                      <PriorityIcon className="w-3 h-3" />
                                      {isRTL ? pInfo.labelAr : pInfo.labelEn}
                                    </span>
                                    {getStatusBadge(c.status)}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                    {c.title_ar}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                    {c.description || (isRTL ? 'لا يوجد وصف تفصيلي مسجل للمطالبة.' : 'No detailed description recorded.')}
                                  </p>
                                </div>

                                {/* Financial Impact Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">{isRTL ? 'المبلغ المطالب به' : 'Claimed Amount'}</span>
                                    <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                      {formatEGP(c.claimed_amount, false, isRTL)}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">{isRTL ? 'المبلغ المعتمد' : 'Approved Amount'}</span>
                                    <span className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                                      {c.approved_amount !== null ? formatEGP(c.approved_amount, false, isRTL) : (isRTL ? 'قيد التقييم والدراسة' : 'Under Review')}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">{isRTL ? 'السند التعاقدي' : 'Contract Basis'}</span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                      {c.clause_reference || (isRTL ? 'البند 20.1 من شروط الفيديك' : 'FIDIC Cl. 20.1')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: VARIATION ORDERS */}
              {activeTab === 'vos' && (
                <>
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/50">
                          <tr>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? '# رقم الأمر' : '# VO No.'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'موضوع التغيير' : 'Subject'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'نوع التغيير' : 'VO Type'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر المالي' : 'Cost Impact'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر الزمني' : 'Time Impact'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'أولوية التأثير' : 'Impact Priority'}</th>
                            <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الحالة' : 'Status'}</th>
                            <th className="px-5 py-3.5 text-end font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'إجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredVOs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                <TrendingUp className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                <p className="font-semibold">{isRTL ? 'لا توجد أوامر تغيير مطابقة' : 'No variation orders found'}</p>
                              </td>
                            </tr>
                          ) : (
                            filteredVOs.map((v) => {
                              const pInfo = getVOPriority(v);
                              const isAddition = v.vo_type === 'addition';
                              const isOmission = v.vo_type === 'omission';

                              return (
                                <tr
                                  key={v.id}
                                  tabIndex={0}
                                  onClick={() => setSelectedItem({ type: 'vos', data: v })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setSelectedItem({ type: 'vos', data: v });
                                    }
                                  }}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-none"
                                >
                                  <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {v.vo_number}
                                  </td>
                                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                                    {v.title_ar}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        isAddition
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                          : isOmission
                                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                          : 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                                      }`}
                                    >
                                      {isAddition && <TrendingUp className="w-3 h-3" />}
                                      {isOmission && <TrendingDown className="w-3 h-3" />}
                                      {!isAddition && !isOmission && <RefreshCw className="w-3 h-3" />}
                                      {isRTL
                                        ? v.vo_type === 'addition'
                                          ? 'أعمال إضافية'
                                          : v.vo_type === 'omission'
                                          ? 'حذف وتقليص'
                                          : 'استبدال وتعديل'
                                        : v.vo_type === 'addition'
                                        ? 'Addition'
                                        : v.vo_type === 'omission'
                                        ? 'Omission'
                                        : 'Substitution'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={`font-black tabular-nums text-xs sm:text-sm px-2.5 py-1 rounded-lg ${
                                        (v.cost_impact || 0) >= 0
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {(v.cost_impact || 0) >= 0 ? '+' : ''}
                                      {formatEGP(v.cost_impact || 0, false, isRTL)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {v.time_impact_days
                                      ? (isRTL ? `+${v.time_impact_days} يوم` : `+${v.time_impact_days} days`)
                                      : (isRTL ? 'لا أثر زمني' : 'No time impact')}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${pInfo.badgeClass}`}
                                    >
                                      {isRTL ? pInfo.labelAr : pInfo.labelEn}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">{getStatusBadge(v.status)}</td>
                                  <td className="px-5 py-4 text-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItem({ type: 'vos', data: v });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                      title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* VOs Kanban View */}
                  {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'submitted', titleAr: 'مقدم للدراسة', titleEn: 'Submitted', headerBg: 'border-t-4 border-t-sky-500' },
                        { id: 'under_review', titleAr: 'قيد الاعتماد الفني', titleEn: 'Under Review', headerBg: 'border-t-4 border-t-amber-500' },
                        { id: 'approved', titleAr: 'معتمد رسمياً', titleEn: 'Approved', headerBg: 'border-t-4 border-t-emerald-500' },
                        { id: 'rejected', titleAr: 'مرفوض', titleEn: 'Rejected', headerBg: 'border-t-4 border-t-rose-500' },
                      ].map((col) => {
                        const colVOs = filteredVOs.filter((v) => v.status === col.id);
                        return (
                          <div
                            key={col.id}
                            className={`bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 ${col.headerBg}`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                {isRTL ? col.titleAr : col.titleEn}
                              </h3>
                              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {colVOs.length}
                              </span>
                            </div>

                            <div className="space-y-3 min-h-[150px]">
                              {colVOs.length === 0 ? (
                                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                                  {isRTL ? 'لا توجد أوامر في هذه المرحلة' : 'No VOs in this stage'}
                                </div>
                              ) : (
                                colVOs.map((v) => {
                                  const pInfo = getVOPriority(v);
                                  return (
                                    <div
                                      key={v.id}
                                      tabIndex={0}
                                      role="button"
                                      onClick={() => setSelectedItem({ type: 'vos', data: v })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          setSelectedItem({ type: 'vos', data: v });
                                        }
                                      }}
                                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer space-y-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                          {v.vo_number}
                                        </span>
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pInfo.badgeClass}`}
                                        >
                                          {isRTL ? pInfo.labelAr : pInfo.labelEn}
                                        </span>
                                      </div>

                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                        {v.title_ar}
                                      </h4>

                                      {/* Financial Impact Badge */}
                                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر المالي:' : 'Cost Impact:'}</span>
                                        <span
                                          className={`font-black text-xs tabular-nums px-2 py-0.5 rounded ${
                                            (v.cost_impact || 0) >= 0
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                                          }`}
                                        >
                                          {(v.cost_impact || 0) >= 0 ? '+' : ''}
                                          {formatEGP(v.cost_impact || 0, false, isRTL)}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                                        <span>
                                          {v.time_impact_days
                                            ? (isRTL ? `+${v.time_impact_days} يوم` : `+${v.time_impact_days} days`)
                                            : (isRTL ? 'لا أثر زمني' : '0 days')}
                                        </span>
                                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                                          {isRTL
                                            ? v.vo_type === 'addition'
                                              ? 'أعمال إضافية'
                                              : v.vo_type === 'omission'
                                              ? 'حذف وتقليص'
                                              : 'استبدال وتعديل'
                                            : v.vo_type}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VOs Timeline View */}
                  {viewMode === 'timeline' && (
                    <div className="relative border-s-2 border-emerald-500/30 ms-4 sm:ms-8 space-y-6 py-2">
                      {filteredVOs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                          {isRTL ? 'لا توجد أوامر تغيير مسجلة' : 'No VOs found'}
                        </div>
                      ) : (
                        filteredVOs.map((v) => {
                          const pInfo = getVOPriority(v);
                          return (
                            <div key={v.id} className="relative ps-6 sm:ps-8">
                              <div className="absolute -start-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white dark:border-slate-900 shadow" />

                              <div
                                tabIndex={0}
                                role="button"
                                onClick={() => setSelectedItem({ type: 'vos', data: v })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setSelectedItem({ type: 'vos', data: v });
                                  }
                                }}
                                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer space-y-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                      {v.vo_number}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                      {isRTL ? `طالب التغيير: ${v.requested_by || 'إدارة المشروع'}` : `Requested by: ${v.requested_by || 'Project Management'}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${pInfo.badgeClass}`}
                                    >
                                      {isRTL ? pInfo.labelAr : pInfo.labelEn}
                                    </span>
                                    {getStatusBadge(v.status)}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                    {v.title_ar}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                    {v.description || v.revised_scope || (isRTL ? 'لا يوجد وصف تفصيلي مسجل للأمر.' : 'No description provided.')}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRTL ? 'الأثر المالي الصافي' : 'Net Cost Impact'}</span>
                                    <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                      {(v.cost_impact || 0) >= 0 ? '+' : ''}
                                      {formatEGP(v.cost_impact || 0, false, isRTL)}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRTL ? 'الأثر الزمني للمشروع' : 'Schedule Impact'}</span>
                                    <span className="text-sm font-black tabular-nums text-amber-600 dark:text-amber-400">
                                      {v.time_impact_days
                                        ? (isRTL ? `+${v.time_impact_days} يوم عمل` : `+${v.time_impact_days} work days`)
                                        : (isRTL ? 'دون أثر زمني' : 'No schedule impact')}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isRTL ? 'تصنيف التغيير' : 'Classification'}</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {isRTL
                                        ? v.vo_type === 'addition'
                                          ? 'إضافة بند مستحدث'
                                          : v.vo_type === 'omission'
                                          ? 'إلغاء كميات'
                                          : 'تعديل مواصفات'
                                        : v.vo_type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 4: EOT REQUESTS */}
              {activeTab === 'eots' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? '# رقم الطلب' : '# EOT No.'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'أسباب التأخير والسند التعاقدي' : 'Delay Reasons & Clause'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المدة المطلوبة' : 'Requested Days'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المدة المعتمدة' : 'Approved Days'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'تاريخ التقديم' : 'Submission Date'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الحالة' : 'Status'}</th>
                        <th className="px-5 py-3.5 text-end font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredEOTs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                <p className="font-semibold">{isRTL ? 'لا توجد طلبات تمديد مدة' : 'No EOT requests found'}</p>
                              </td>
                            </tr>
                      ) : (
                        filteredEOTs.map((e) => (
                          <tr
                            key={e.id}
                            tabIndex={0}
                            onClick={() => setSelectedItem({ type: 'eots', data: e })}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                setSelectedItem({ type: 'eots', data: e });
                              }
                            }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-none"
                          >
                            <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {e.eot_number}
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{e.title_ar || e.reason}</div>
                              {e.clause_reference && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {isRTL ? `السند التعاقدي: ${e.clause_reference}` : `Clause Ref: ${e.clause_reference}`}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-bold tabular-nums text-slate-900 dark:text-white">
                              {isRTL ? `${e.requested_days} يوم` : `${e.requested_days} days`}
                            </td>
                            <td className="px-5 py-4 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {e.approved_days !== null
                                ? (isRTL ? `${e.approved_days} يوم` : `${e.approved_days} days`)
                                : (isRTL ? 'قيد المراجعة' : 'Under Review')}
                            </td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                              {formatDate(e.submission_date, isRTL)}
                            </td>
                            <td className="px-5 py-4">{getStatusBadge(e.status)}</td>
                            <td className="px-5 py-4 text-end">
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setSelectedItem({ type: 'eots', data: e });
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: IPC CERTIFICATES */}
              {activeTab === 'ipcs' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? '# رقم المستخلص' : '# IPC No.'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الفترة الزمنية' : 'Billing Period'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'المبلغ الإجمالي' : 'Gross Amount'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'استقطاعات (ضمان/مقدمة)' : 'Deductions (Ret./Adv.)'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'صافي المستحق للصرف' : 'Net Payable'}</th>
                        <th className="px-5 py-3.5 text-start font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'الحالة' : 'Status'}</th>
                        <th className="px-5 py-3.5 text-end font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredIPCs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                            <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                            <p className="font-semibold">{isRTL ? 'لا توجد مستخلصات مسجلة' : 'No IPC certificates found'}</p>
                          </td>
                        </tr>
                      ) : (
                        filteredIPCs.map((i) => {
                          const totalDeductions = (i.retention_deduction || 0) + (i.advance_recovery || 0);
                          return (
                            <tr
                              key={i.id}
                              tabIndex={0}
                              onClick={() => setSelectedItem({ type: 'ipcs', data: i })}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  setSelectedItem({ type: 'ipcs', data: i });
                                }
                              }}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-none"
                            >
                              <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {isRTL ? `مستخلص ${i.ipc_number}` : `IPC-${i.ipc_number}`}
                              </td>
                              <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-xs tabular-nums">
                                {formatDate(i.period_start, isRTL)} — {formatDate(i.period_end, isRTL)}
                              </td>
                              <td className="px-5 py-4 font-bold tabular-nums text-slate-900 dark:text-white">
                                {formatEGP(i.gross_amount, false, isRTL)}
                              </td>
                              <td className="px-5 py-4 text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                                - {formatEGP(totalDeductions, false, isRTL)}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                                  {formatEGP(i.net_payable, false, isRTL)}
                                </span>
                              </td>
                              <td className="px-5 py-4">{getStatusBadge(i.status)}</td>
                              <td className="px-5 py-4 text-end">
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    setSelectedItem({ type: 'ipcs', data: i });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                  title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Accessible Modal: Add Record Dialog */}
      {isAddModalOpen && canEdit && (
        <AddRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultTab={activeTab}
          projectId={effectiveProjectId}
          contracts={contracts}
          ipcs={ipcs}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData(effectiveProjectId, true);
          }}
          isRTL={isRTL}
          canEdit={canEdit}
        />
      )}

      {/* Accessible Modal: Item Details & Status Management */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusUpdated={() => {
            setSelectedItem(null);
            loadData(effectiveProjectId, true);
          }}
          isRTL={isRTL}
          contracts={contracts}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: Accessible Add Record Modal
// -------------------------------------------------------------
interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: TabKey;
  projectId: string;
  contracts: Contract[];
  ipcs: IPCCertificate[];
  onSuccess: () => void;
  isRTL: boolean;
  canEdit?: boolean;
}

function AddRecordModal({
  isOpen,
  onClose,
  defaultTab,
  projectId,
  contracts,
  ipcs,
  onSuccess,
  isRTL,
  canEdit = false
}: AddRecordModalProps) {
  const [recordType, setRecordType] = useState<TabKey>(defaultTab);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [contractId, setContractId] = useState(contracts[0]?.id || '');
  const [number, setNumber] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [voType, setVoType] = useState<'addition' | 'omission' | 'substitution'>('addition');
  const [clauseRef, setClauseRef] = useState('FIDIC Sub-Clause 20.1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [contractorName, setContractorName] = useState('');

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Initial focus
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!titleAr.trim() && recordType !== 'ipcs') {
      toast.error('يرجى كتابة عنوان السجل');
      return;
    }

    setSaving(true);
    try {
      if (recordType === 'claims') {
        await contractsService.saveClaim({
          project_id: projectId,
          contract_id: contractId || contracts[0]?.id || '',
          claim_number: number || `CLM-${Date.now().toString().slice(-4)}`,
          claim_type: 'cost_claim',
          title_ar: titleAr.trim(),
          description: description.trim(),
          claimed_amount: Number(amount) || 0,
          approved_amount: null,
          submitted_by: 'مدير العقود',
          reviewed_by: null,
          status: 'submitted',
          submission_date: new Date().toISOString(),
          clause_reference: clauseRef.trim() || 'FIDIC Cl. 20.1',
          supporting_docs: [],
        });
        toast.success('تم تقديم المطالبة التعاقدية بنجاح');
      } else if (recordType === 'vos') {
        const netCost = voType === 'omission' ? -Math.abs(Number(amount) || 0) : Number(amount) || 0;
        await contractsService.saveVariationOrder({
          project_id: projectId,
          contract_id: contractId || contracts[0]?.id || '',
          vo_number: number || `VO-${Date.now().toString().slice(-4)}`,
          title_ar: titleAr.trim(),
          description: description.trim(),
          vo_type: voType,
          original_scope: 'حسب المخططات الأصلية المعتمدة',
          revised_scope: description.trim(),
          cost_impact: netCost,
          time_impact_days: Number(days) || 0,
          status: 'submitted',
          requested_by: 'الاستشاري المشرف',
        });
        toast.success('تم إصدار أمر التغيير وإرساله للدراسة');
      } else if (recordType === 'contracts') {
        await contractsService.saveContract({
          project_id: projectId,
          contract_number: number || `CNT-${Date.now().toString().slice(-4)}`,
          title_ar: titleAr.trim(),
          contractor_name: contractorName.trim() || 'بي زون التجارية (P.Zone International)',
          original_value: Number(amount) || 0,
          revised_value: Number(amount) || 0,
          currency: 'EGP',
          start_date: startDate,
          end_date: endDate || startDate,
          status: 'active',
          retention_pct: 0,
          advance_payment_pct: 0,
          performance_bond_pct: 0,
        });
        toast.success('تم تسجيل العقد الجديد بنجاح');
      } else if (recordType === 'eots') {
        await contractsService.saveEOTRequest({
          project_id: projectId,
          contract_id: contractId || contracts[0]?.id || '',
          eot_number: number || `EOT-${Date.now().toString().slice(-4)}`,
          title_ar: titleAr.trim(),
          reason: description.trim() || titleAr.trim(),
          requested_days: Number(days) || 15,
          approved_days: null,
          clause_reference: clauseRef.trim() || 'FIDIC Sub-Clause 8.4',
          status: 'submitted',
          requested_by: 'المقاول الرئيسي',
          submission_date: new Date().toISOString(),
        });
        toast.success('تم تسجيل طلب تمديد المدة بنجاح');
      } else if (recordType === 'ipcs') {
        const gross = Number(amount) || 0;
        const resolvedContractId = contractId || contracts[0]?.id || '';
        const selectedContract = contracts.find((c) => c.id === resolvedContractId) || contracts[0];
        const contractIpcs = ipcs.filter((i) => i.contract_id === resolvedContractId);

        const contractValue = Number(
          selectedContract?.revised_value || selectedContract?.original_value || 0
        );
        const retentionPct = Number(selectedContract?.retention_pct ?? 10);
        const advancePaymentPct = Number(selectedContract?.advance_payment_pct ?? 10);
        const totalAdvancePaid = contractValue > 0 ? (contractValue * advancePaymentPct) / 100 : 0;
        const cumulativeRetentionWithheldBefore = contractIpcs.reduce(
          (sum, i) => sum + (Number(i.retention_deduction) || 0),
          0
        );
        const cumulativeAdvanceRecoveredBefore = contractIpcs.reduce(
          (sum, i) => sum + (Number(i.advance_recovery) || 0),
          0
        );
        const previousCertified = contractIpcs.reduce(
          (sum, i) => sum + (Number(i.current_certified ?? i.gross_amount) || 0),
          0
        );

        const ipcCalc = calculateContractualIpc({
          grossAmount: gross,
          retentionPct,
          advanceRecoveryPct: advancePaymentPct,
          totalAdvancePaid,
          cumulativeAdvanceRecoveredBefore,
          contractValue: contractValue > 0 ? contractValue : gross * 10,
          retentionCapPct: Number((selectedContract as any)?.retention_cap_pct ?? retentionPct ?? 10),
          cumulativeRetentionWithheldBefore,
        });

        await contractsService.saveIPCCertificate({
          project_id: projectId,
          contract_id: resolvedContractId,
          ipc_number: Number(number) || contractIpcs.length + 1,
          period_start: startDate,
          period_end: endDate || startDate,
          gross_amount: ipcCalc.grossAmount,
          retention_deduction: ipcCalc.retentionDeduction,
          advance_recovery: ipcCalc.advanceRecoveryDeduction,
          previous_certified: Number(previousCertified.toFixed(2)),
          current_certified: ipcCalc.grossAmount,
          net_payable: ipcCalc.netPayable,
          status: 'submitted',
        });
        toast.success('تم إنشاء شهادة الدفع بنجاح');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as { message?: string } | null)?.message || 'حدث خطأ أثناء حفظ السجل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
      ref={modalRef}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-add-title" className="text-base font-black text-slate-900 dark:text-white">
                {isRTL ? 'إضافة سجل تعاقدي جديد' : 'New Contractual Record'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRTL ? 'تسجيل مطالبة أو أمر تغيير أو عقد جديد' : 'Register claim, VO or contract'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Type Selector */}
        <div className="px-6 pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
            نوع السجل:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { id: 'claims', label: 'مطالبة', icon: FileWarning },
              { id: 'vos', label: 'أمر تغيير', icon: TrendingUp },
              { id: 'contracts', label: 'عقد', icon: FileSignature },
              { id: 'eots', label: 'تمديد مدة', icon: Clock },
              { id: 'ipcs', label: 'مستخلص', icon: CreditCard },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRecordType(t.id as TabKey)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                  recordType === t.id
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
          {contracts.length > 0 && recordType !== 'contracts' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                العقد المرجعي المرتبط:
              </label>
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {c.contract_number} — {c.title_ar} ({c.contractor_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-number" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                رقم المرجع التعاقدي:
              </label>
              <input
                id="input-number"
                ref={firstInputRef}
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder={
                  recordType === 'claims'
                    ? 'مثال: CLM-2026-001'
                    : recordType === 'vos'
                    ? 'مثال: VO-2026-01'
                    : recordType === 'contracts'
                    ? 'مثال: CNT-2026-05'
                    : 'رقم المرجع'
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {recordType === 'vos' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isRTL ? 'نوع أمر التغيير:' : 'VO Type:'}
                </label>
                <select
                  value={voType}
                  onChange={(e) => setVoType(e.target.value as typeof voType)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="addition" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'أعمال إضافية' : 'Addition'}</option>
                  <option value="omission" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'حذف وتقليص كميات' : 'Omission'}</option>
                  <option value="substitution" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{isRTL ? 'استبدال ومواءمة مواصفات' : 'Substitution'}</option>
                </select>
              </div>
            )}

            {recordType === 'contracts' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isRTL ? 'اسم المقاول:' : 'Contractor Name:'}
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder={isRTL ? 'مثال: بي زون التجارية (P.Zone International)' : 'e.g. P.Zone International'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {recordType !== 'ipcs' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isRTL ? 'عنوان الموضوع التعاقدي:' : 'Subject / Title:'}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={isRTL ? 'مثال: مطالبة تعويض فروق أسعار المواد الإنشائية' : 'e.g. Price fluctuation compensation claim'}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {recordType === 'claims'
                  ? (isRTL ? 'المبلغ المطالب به:' : 'Claimed Amount:')
                  : recordType === 'vos'
                  ? (isRTL ? 'الأثر المالي التقديري:' : 'Estimated Cost Impact:')
                  : recordType === 'contracts'
                  ? (isRTL ? 'قيمة العقد الإجمالية:' : 'Total Contract Value:')
                  : (isRTL ? 'المبلغ الإجمالي:' : 'Gross Amount:')}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isRTL ? 'القيمة (ج.م)' : 'Amount (EGP)'}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {(recordType === 'vos' || recordType === 'eots') && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isRTL ? 'الأثر الزمني المقدر (أيام):' : 'Estimated Time Impact (Days):'}
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder={isRTL ? 'مثال: 30' : 'e.g. 30'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            {(recordType === 'claims' || recordType === 'eots') && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isRTL ? 'سند البند التعاقدي في عقد الفيديك:' : 'Contract Clause Reference:'}
                </label>
                <input
                  type="text"
                  value={clauseRef}
                  onChange={(e) => setClauseRef(e.target.value)}
                  placeholder={isRTL ? 'مثال: البند 20.1 / البند 8.4' : 'e.g. Sub-Clause 20.1 / Cl. 8.4'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {recordType === 'ipcs' && (() => {
            const previewGross = Number(amount) || 0;
            const resolvedContractId = contractId || contracts[0]?.id || '';
            const selectedContract = contracts.find((c) => c.id === resolvedContractId) || contracts[0];
            const contractIpcs = ipcs.filter((i) => i.contract_id === resolvedContractId);
            const contractValue = Number(
              selectedContract?.revised_value || selectedContract?.original_value || 0
            );
            const retentionPct = Number(selectedContract?.retention_pct ?? 10);
            const advancePaymentPct = Number(selectedContract?.advance_payment_pct ?? 10);
            const totalAdvancePaid = contractValue > 0 ? (contractValue * advancePaymentPct) / 100 : 0;
            const cumulativeRetentionWithheldBefore = contractIpcs.reduce(
              (sum, i) => sum + (Number(i.retention_deduction) || 0),
              0
            );
            const cumulativeAdvanceRecoveredBefore = contractIpcs.reduce(
              (sum, i) => sum + (Number(i.advance_recovery) || 0),
              0
            );
            const preview = calculateContractualIpc({
              grossAmount: previewGross,
              retentionPct,
              advanceRecoveryPct: advancePaymentPct,
              totalAdvancePaid,
              cumulativeAdvanceRecoveredBefore,
              contractValue: contractValue > 0 ? contractValue : previewGross * 10,
              retentionCapPct: Number((selectedContract as any)?.retention_cap_pct ?? retentionPct ?? 10),
              cumulativeRetentionWithheldBefore,
            });
            return (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>حجز ضمان الأعمال ({retentionPct}%):</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatEGP(preview.retentionDeduction)}
                    {preview.isRetentionCapped ? ' (وصل للحد الأقصى)' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>استرداد الدفعة المقدمة ({advancePaymentPct}%):</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatEGP(preview.advanceRecoveryDeduction)}
                    {preview.isAdvanceFullyRecovered ? ' (تم الاسترداد بالكامل)' : ''}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>صافي المستحق للصرف:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatEGP(preview.netPayable)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isRTL ? 'التفاصيل والأسباب التعاقدية:' : 'Contractual Grounds & Details:'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRTL ? 'شرح موجز للأسباب التعاقدية والسجلات المعاصرة المساندة للطلب...' : 'Brief description of contractual grounds and contemporaneous records...'}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ السجل' : 'Save Record')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Item Details & Dispute Audit Modal
// -------------------------------------------------------------
interface ItemData {
  id: string;
  project_id?: string;
  contract_id?: string;
  claim_number?: string;
  vo_number?: string;
  contract_number?: string;
  eot_number?: string;
  ipc_number?: string | number;
  title_ar?: string;
  reason?: string;
  claimed_amount?: number;
  approved_amount?: number | null;
  cost_impact?: number;
  time_impact_days?: number;
  requested_days?: number;
  approved_days?: number | null;
  clause_reference?: string | null;
  status?: string;
  description?: string;
  original_scope?: string;
}

interface ItemDetailsModalProps {
  item: {
    type: TabKey;
    data: ItemData;
  };
  onClose: () => void;
  onStatusUpdated: () => void;
  isRTL: boolean;
  contracts: Contract[];
  canEdit?: boolean;
}

function ItemDetailsModal({
  item,
  onClose,
  onStatusUpdated,
  isRTL,
  contracts,
  canEdit = false
}: ItemDetailsModalProps) {
  const { type, data } = item;
  const [updating, setUpdating] = useState(false);
  const [approvedAmountInput, setApprovedAmountInput] = useState(
    data.approved_amount !== null && data.approved_amount !== undefined
      ? String(data.approved_amount)
      : String(data.claimed_amount || data.cost_impact || '')
  );
  const [approvedDaysInput, setApprovedDaysInput] = useState(
    data.approved_days !== null && data.approved_days !== undefined
      ? String(data.approved_days)
      : String(data.requested_days || '')
  );

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const contract = contracts.find((c) => c.id === data.contract_id);

  // Status transition handler
  const handleUpdateStatus = async (newStatus: ClaimStatus) => {
    if (!canEdit) return;
    setUpdating(true);
    const statusMapAr: Record<string, string> = {
      approved: 'معتمد رسمياً',
      under_review: 'قيد التقييم الفني',
      rejected: 'مرفوض / تسجيل نزاع',
      closed: 'مغلق نهائياً',
      submitted: 'مقدم للدراسة',
      settled: 'تمت التسوية',
    };
    const statusLabel = isRTL ? (statusMapAr[newStatus] || newStatus) : newStatus;

    try {
      if (type === 'claims') {
        const approvedVal = newStatus === 'approved' ? Number(approvedAmountInput) || 0 : undefined;
        await contractsService.updateClaimStatus(data.id, newStatus, 'مهندس العقد الاستشاري', approvedVal, data.project_id);
        toast.success(isRTL ? `تم تحديث حالة المطالبة إلى: ${statusLabel}` : `Claim status updated to: ${newStatus}`);
      } else if (type === 'vos') {
        await contractsService.saveVariationOrder({
          ...data,
          status: newStatus,
          approved_by: newStatus === 'approved' ? 'مدير المشروع المعتمد' : null,
        });
        toast.success(isRTL ? `تم تحديث حالة أمر التغيير إلى: ${statusLabel}` : `VO status updated to: ${newStatus}`);
      } else if (type === 'eots') {
        const approvedDays = newStatus === 'approved' ? Number(approvedDaysInput) || 0 : undefined;
        await contractsService.updateEOTStatus(data.id, newStatus as any, 'استشاري المشروع', approvedDays, data.project_id);
        toast.success(isRTL ? `تم تحديث حالة طلب التمديد الزمني إلى: ${statusLabel}` : `EOT status updated to: ${newStatus}`);
      }
      onStatusUpdated();
    } catch (err: unknown) {
      toast.error((err as { message?: string } | null)?.message || (isRTL ? 'فشل تحديث الحالة' : 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detail-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {data.claim_number || data.vo_number || data.contract_number || data.eot_number || (isRTL ? `مستخلص ${data.ipc_number}` : `IPC-${data.ipc_number}`)}
              </span>
              <h2 id="modal-detail-title" className="text-base font-black text-slate-900 dark:text-white">
                {data.title_ar || data.reason || (isRTL ? 'تفاصيل السجل التعاقدي' : 'Record Details')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label={isRTL ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-2 space-y-4 overflow-y-auto flex-1">
          {/* Dispute Alert Badge for Claims */}
          {type === 'claims' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-bold block">
                  {isRTL ? 'إشعار التدقيق والمهل التعاقدية (البند 20.1):' : 'Contractual Audit & Deadlines (Clause 20.1):'}
                </span>
                <p>
                  {isRTL
                    ? 'يجب التحقق من تقديم الإشعار خلال مهلة 28 يوماً، والتقرير التفصيلي مع السجلات المعاصرة خلال 42 يوماً لتجنب سقوط الحق بالتقادم التعاقدي.'
                    : 'Notice must be submitted within 28 days and detailed claim with contemporaneous records within 42 days to avoid time-barring.'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.claimed_amount !== undefined && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{isRTL ? 'المبلغ المطالب به:' : 'Claimed Amount:'}</span>
                <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                  {formatEGP(data.claimed_amount, false, isRTL)}
                </p>
              </div>
            )}

            {data.cost_impact !== undefined && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر المالي:' : 'Cost Impact:'}</span>
                <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                  {formatEGP(data.cost_impact, false, isRTL)}
                </p>
              </div>
            )}

            {data.time_impact_days !== undefined && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{isRTL ? 'الأثر الزمني:' : 'Time Impact:'}</span>
                <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                  {data.time_impact_days ? (isRTL ? `${data.time_impact_days} يوم` : `${data.time_impact_days} days`) : (isRTL ? 'لا أثر زمني' : 'No time impact')}
                </p>
              </div>
            )}

            {data.clause_reference && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{isRTL ? 'سند البند التعاقدي:' : 'Clause Reference:'}</span>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {data.clause_reference}
                </p>
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">{isRTL ? 'حالة السجل:' : 'Record Status:'}</span>
              <div>{getStatusBadge(data.status || 'submitted')}</div>
            </div>

            {contract && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{isRTL ? 'العقد المرتبط:' : 'Related Contract:'}</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {contract.title_ar}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isRTL ? 'الوصف والسند الفني:' : 'Description & Grounds:'}
            </span>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {data.description || data.original_scope || data.reason || (isRTL ? 'لا توجد بيانات وصفية مسجلة.' : 'No description recorded.')}
            </div>
          </div>

          {/* Approval Input for Claims / VOs */}
          {canEdit && (type === 'claims' || type === 'vos') && (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3">
              <span className="text-xs font-black text-blue-900 dark:text-blue-300 block">
                {isRTL ? 'تحديد المبلغ المعتمد رسمياً (عند الاعتماد):' : 'Official Approved Amount (upon approval):'}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  placeholder={isRTL ? 'المبلغ المعتمد (ج.م)' : 'Approved Amount (EGP)'}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
          )}

          {/* Approval Input for EOTs */}
          {canEdit && type === 'eots' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">
                {isRTL ? 'تحديد عدد الأيام المعتمدة رسمياً (عند اعتماد التمديد):' : 'Official Approved Days (upon extension approval):'}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={approvedDaysInput}
                  onChange={(e) => setApprovedDaysInput(e.target.value)}
                  placeholder={isRTL ? 'الأيام المعتمدة' : 'Approved Days'}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isRTL ? 'يوم' : 'days'}</span>
              </div>
            </div>
          )}

          {/* Status Workflow Actions */}
          {canEdit && (type === 'claims' || type === 'vos' || type === 'eots') && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isRTL ? 'إجراءات دورة الاعتماد وحسم النزاع:' : 'Approval & Dispute Actions:'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('approved')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'اعتماد رسمي' : 'Approve'}</span>
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('under_review')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-amber-600/20"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'قيد التقييم الفني' : 'Under Review'}</span>
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'رفض / تسجيل نزاع' : 'Dispute / Reject'}</span>
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('closed')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-slate-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'إغلاق السجل' : 'Close'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            {isRTL ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
