'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProjectService } from '@/lib/services/project.service';
import { UserService, UserProfileFull, UserAccountStatus } from '@/lib/services/userService';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  MATRIX_ROLES,
  ASSIGNABLE_ROLES,
} from '@/lib/rbac/role-matrix';
import { Project } from '@/types';
import { toast } from 'sonner';
import { FINANCIAL_ALLOWED_ROLES } from '@/components/planning/PriceGate';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  DollarSign,
  UserCheck,
  Building,
  Search,
  Check,
  Loader2,
  MessageCircle,
  Lock,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  UserX,
  User
} from 'lucide-react';

interface UserAccessCustomizationModalProps {
  user: UserProfileFull | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  adminUserId?: string;
}

/**
 * Validates and formats user phone numbers into international WhatsApp format.
 * Suppresses dummy placeholders (e.g. 01000000040, all zeros, <10 digits).
 */
function getValidWhatsAppUrl(phone?: string | null, userName?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (/^0?10{6,}/.test(digits) || /^0+$/.test(digits) || digits.length < 10) {
    return null;
  }
  let internationalNumber = digits;
  if (digits.startsWith('01') && digits.length === 11) {
    internationalNumber = `20${digits.substring(1)}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    internationalNumber = `20${digits}`;
  }

  const name = userName ? `م/ ${userName}` : 'زميلنا العزيز';
  const text = encodeURIComponent(`مرحباً ${name}، بخصوص تفعيل حسابك وتحديد صلاحيات الوصول على بوابة Pzone ERP...`);
  return `https://wa.me/${internationalNumber}?text=${text}`;
}

// Logical grouping of the 22 canonical roles for clean visual presentation
const ROLE_GROUPS: {
  id: string;
  titleAr: string;
  iconName: string;
  roles: string[];
}[] = [
  {
    id: 'executive',
    titleAr: 'الإدارة العليا والمجلس (Executive & Board)',
    iconName: 'Crown',
    roles: ['admin', 'chairman', 'ceo', 'coo', 'coo_assistant', 'board_member'],
  },
  {
    id: 'commercial',
    titleAr: 'الإدارة التجارية والمالية والعقود (Commercial & Finance)',
    iconName: 'Receipt',
    roles: ['commercial_manager', 'finance', 'contract_admin', 'cost_control', 'ipc_clerk', 'estimator'],
  },
  {
    id: 'planning_to',
    titleAr: 'التخطيط والمكتب الفني (Planning & Technical Office)',
    iconName: 'FolderKanban',
    roles: ['planning_manager', 'planning_engineer', 'technical_office'],
  },
  {
    id: 'site_execution',
    titleAr: 'التنفيذ الميداني وإدارة المشاريع (Site & Project Management)',
    iconName: 'HardHat',
    roles: ['project_manager', 'site_engineer'],
  },
  {
    id: 'logistics',
    titleAr: 'المشتريات والمخازن (Procurement & Stores)',
    iconName: 'Truck',
    roles: ['procurement', 'inventory'],
  },
];

export function UserAccessCustomizationModal({
  user,
  isOpen,
  onClose,
  onSaved,
  adminUserId,
}: UserAccessCustomizationModalProps) {
  const queryClient = useQueryClient();

  // Active Tab inside the modal
  const [activeTab, setActiveTab] = useState<'status_roles' | 'projects' | 'commercial'>('status_roles');

  // Form State
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<UserAccountStatus>('active');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [projectScopeMode, setProjectScopeMode] = useState<'all' | 'restricted'>('all');
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
  const [priceAccessGranted, setPriceAccessGranted] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [roleSearch, setRoleSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Fetch all projects for allocation
  const { data: allProjects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['admin-all-projects-for-access'],
    queryFn: () => ProjectService.getProjects(),
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  // Fetch current user assigned project IDs when modal opens
  const { data: currentUserProjectIds = [], isLoading: loadingAssigned } = useQuery<string[]>({
    queryKey: ['admin-user-assigned-projects', user?.id],
    queryFn: () => (user ? UserService.getUserAssignedProjectIds(user.id) : Promise.resolve([])),
    enabled: isOpen && !!user,
  });

  // Sync state when user prop changes
  useEffect(() => {
    if (user && isOpen) {
      const initialStatus =
        user.is_active === false
          ? 'suspended'
          : user.status || (user.roles && user.roles.length > 0 ? 'active' : 'pending_activation');
      setStatus(initialStatus);
      setFullName(user.full_name || user.full_name_ar || user.full_name_en || '');
      setSelectedRoles(user.roles || []);
      const hasFinancial = (user.roles || []).some((r) => FINANCIAL_ALLOWED_ROLES.includes(r));
      setPriceAccessGranted(Boolean(user.price_access_granted || hasFinancial));
      setAdminNotes('');
      setActiveTab('status_roles');
    }
  }, [user, isOpen]);

  // Sync assigned project IDs once query loading finishes
  useEffect(() => {
    if (isOpen && !loadingAssigned) {
      if (currentUserProjectIds.length > 0) {
        setProjectScopeMode('restricted');
        setAssignedProjectIds(currentUserProjectIds);
      } else {
        // If user already has restricted role like PM or Site Engineer, default to restricted
        const hasProjectRole = selectedRoles.some((r) => ['project_manager', 'site_engineer'].includes(r));
        setProjectScopeMode(hasProjectRole ? 'restricted' : 'all');
        setAssignedProjectIds([]);
      }
    }
  }, [currentUserProjectIds, isOpen, loadingAssigned]);

  if (!isOpen || !user) return null;

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      if (FINANCIAL_ALLOWED_ROLES.includes(role) && !prev.includes(role)) {
        setPriceAccessGranted(true);
      }
      return next;
    });
  };

  const handleProjectToggle = (projectId: string) => {
    setAssignedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    setAssignedProjectIds(allProjects.map((p) => p.id));
  };

  const handleClearProjects = () => {
    setAssignedProjectIds([]);
  };

  const handleSave = async () => {
    if (status === 'active' && selectedRoles.length === 0) {
      toast.error('يرجى تحديد دور وظيفي واحد على الأقل قبل تفعيل الحساب لمنع حظره من دخول المنظومة');
      setActiveTab('status_roles');
      return;
    }

    setSaving(true);
    try {
      // Determine project ids to persist:
      // If user has restricted roles (e.g. project_manager, site_engineer) and scope is 'all',
      // map all available project IDs so pm_user_project_access is explicitly populated
      const hasRestrictedRole = selectedRoles.some((r) => ['project_manager', 'site_engineer'].includes(r));
      const targetProjectIds = projectScopeMode === 'restricted'
        ? assignedProjectIds
        : (hasRestrictedRole ? (allProjects || []).map((p: Project) => p.id) : []);

      await UserService.updateUserAccess({
        userId: user.id,
        fullName: fullName.trim() || undefined,
        status,
        roles: selectedRoles,
        assignedProjectIds: targetProjectIds,
        priceAccessGranted,
        adminUserId,
        notes: adminNotes.trim() || undefined,
      });

      // Invalidate relevant caches to maintain consistent live state
      queryClient.invalidateQueries({ queryKey: ['admin-user-assigned-projects', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-status', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });

      const displayName = fullName.trim() || user.full_name || user.email;
      toast.success(
        status === 'active'
          ? `تم تفعيل حساب ${displayName} وتحديث بياناته وصلاحياته بنجاح!`
          : `تم تحديث بيانات وصلاحيات ${displayName} بنجاح`
      );

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'فشل حفظ وتحديث الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  // Filter projects by search
  const filteredProjects = allProjects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const term = projectSearch.toLowerCase();
    const code = (p.project_code || p.code || '').toLowerCase();
    const name = (p.project_name || p.name_ar || '').toLowerCase();
    const client = (p.client?.name_ar || p.client_name_raw || '').toLowerCase();
    return code.includes(term) || name.includes(term) || client.includes(term);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-customization-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glow & Header */}
        <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg shadow-inner">
              {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="user-customization-title" className="text-base sm:text-lg font-bold text-white">
                  {user.full_name || 'مستخدم بدون اسم'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : status === 'pending_activation'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {status === 'active'
                    ? 'نشط ومعتمد'
                    : status === 'pending_activation'
                    ? 'بانتظار التفعيل'
                    : 'معلق'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              const whatsAppUrl = getValidWhatsAppUrl(user.phone, user.full_name);
              if (!whatsAppUrl) return null;
              return (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
                  title="مراسلة عبر واتساب"
                >
                  <MessageCircle size={14} />
                  <span>واتساب</span>
                </a>
              );
            })()}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('status_roles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'status_roles'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={15} />
            <span>1. حالة الحساب والأدوار ({selectedRoles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderKanban size={15} />
            <span>2. نطاق المشاريع ({projectScopeMode === 'all' ? 'الكل' : assignedProjectIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commercial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'commercial'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={15} />
            <span>3. الأسعار والماليات (Price Gate)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Status & Roles */}
          {activeTab === 'status_roles' && (
            <div className="space-y-6 animate-fadeIn">
              {/* User Display Name Editor */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="user-fullname-input" className="text-xs font-bold text-slate-300 block">
                    الاسم الكامل للمستخدم (Display Full Name):
                  </label>
                  <span className="text-[10px] text-cyan-400 font-medium">
                    ينعكس في كافة البوابات ولجميع المستخدمين
                  </span>
                </div>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="user-fullname-input"
                    type="text"
                    placeholder="مثال: المهندس مصطفى عمر / Omar M."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pe-10 ps-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Account Status Switcher */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  الحالة التشغيلية للحساب (Account Lifecycle):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 size={16} className={status === 'active' ? 'text-emerald-400' : 'text-slate-500'} />
                    <div className="text-start">
                      <div>نشط ومعتمد (Active)</div>
                      <div className="text-[10px] text-slate-500 font-normal">يسمح بالدخول واستخدام البوابة</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending_activation')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      status === 'pending_activation'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <AlertCircle size={16} className={status === 'pending_activation' ? 'text-amber-400' : 'text-slate-500'} />
                    <div className="text-start">
                      <div>قيد المراجعة (Pending)</div>
                      <div className="text-[10px] text-slate-500 font-normal">محظور الدخول لحين التفعيل</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('suspended')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      status === 'suspended'
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserX size={16} className={status === 'suspended' ? 'text-rose-400' : 'text-slate-500'} />
                    <div className="text-start">
                      <div>معلق مؤقتاً (Suspended)</div>
                      <div className="text-[10px] text-slate-500 font-normal">إيقاف فوري لصلاحيات الحساب</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Roles Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      تعيين الأدوار الوظيفية (Assigned RBAC Roles)
                    </h3>
                    <p className="text-xs text-slate-400">
                      اختر دوراً أو أكثر لتحديد صلاحيات الوصول إلى بوابات النظام
                    </p>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="تصفية الأدوار..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="w-full pe-9 ps-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {ROLE_GROUPS.map((group) => {
                    const visibleRoles = group.roles.filter((role) => {
                      if (!roleSearch.trim()) return true;
                      const label = (ROLE_LABELS[role] || role).toLowerCase();
                      return label.includes(roleSearch.toLowerCase()) || role.includes(roleSearch.toLowerCase());
                    });

                    if (visibleRoles.length === 0) return null;

                    return (
                      <div key={group.id} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                        <span className="text-xs font-bold text-cyan-400 block border-b border-slate-800/60 pb-2">
                          {group.titleAr}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {visibleRoles.map((role) => {
                            const isSelected = selectedRoles.includes(role);
                            const label = ROLE_LABELS[role] || role;

                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => handleRoleToggle(role)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-start ${
                                  isSelected
                                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 shadow-2xs ring-1 ring-cyan-500/30'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                              >
                                <span className="truncate">{label}</span>
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ms-2 ${
                                    isSelected
                                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                      : 'border-slate-700 bg-slate-800'
                                  }`}
                                >
                                  {isSelected && <Check size={12} strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Project Allocation */}
          {activeTab === 'projects' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Scope Switcher */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  نطاق صلاحية المشاريع (Project Allocation Mode):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProjectScopeMode('all')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-start ${
                      projectScopeMode === 'all'
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building size={18} className={projectScopeMode === 'all' ? 'text-cyan-400' : 'text-slate-500'} />
                    <div>
                      <div>الوصول لجميع المشاريع (All Projects)</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        مناسب للإدارة العليا والتجارية والمكتب الفني والتخطيط
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectScopeMode('restricted')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-start ${
                      projectScopeMode === 'restricted'
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <FolderKanban size={18} className={projectScopeMode === 'restricted' ? 'text-cyan-400' : 'text-slate-500'} />
                    <div>
                      <div>مشاريع محددة فقط (Restricted Scope)</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        إلزامي لمديري المشاريع (PM) ومهندسي الموقع لتقييد الرؤية
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific Project Selector (only visible if restricted) */}
              {projectScopeMode === 'restricted' && (
                <div className="space-y-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>قائمة المشاريع المخصصة للمستخدم</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {assignedProjectIds.length} مشروع محدد
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        حدد المشاريع التي سيتمكن المستخدم من استعراضها والعمل عليها حصرياً
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllProjects}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={handleClearProjects}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ابحث بكود المشروع أو الاسم أو العميل..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pe-10 ps-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  {loadingProjects ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>جاري تحميل قائمة المشاريع...</span>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      لا توجد مشاريع مطابقة للبحث
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pe-1">
                      {filteredProjects.map((p) => {
                        const isAssigned = assignedProjectIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleProjectToggle(p.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isAssigned
                                ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                                : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  #{p.project_code || p.code}
                                </span>
                                <span className="font-bold text-xs truncate text-white">
                                  {p.project_name || p.name_ar}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-1">
                                {p.client?.name_ar || p.client_name_raw || 'عميل مباشر'}
                              </p>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isAssigned
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-800'
                              }`}
                            >
                              {isAssigned && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Commercial & Price Gate */}
          {activeTab === 'commercial' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>صلاحية الاطلاع على الأسعار والماليات (Price Gate)</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      تتحكم هذه الخاصية في إظهار أو إخفاء قيم العقود، وأسعار بنود جدول الكميات (BOQ)، ونسب الأرباح، ومستخلصات مقاولي الباطن.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={priceAccessGranted}
                    onClick={() => setPriceAccessGranted(!priceAccessGranted)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      priceAccessGranted ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow-lg ring-0 transition duration-200 ease-in-out ${
                        priceAccessGranted ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                    priceAccessGranted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {priceAccessGranted ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>
                        مفعل — سيتمكن هذا المستخدم من استعراض كافة القيم المالية والأرقام التعاقدية
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-amber-400 shrink-0" />
                      <span>
                        محجوب — ستظهر القيم المالية بصيغة مشفرة أو محجوبة (***) لحماية سرية الأسعار
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Note Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  ملاحظات الإدارة حول هذا التعيين (اختياري):
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات توجيهية أو أسباب التعيين والتقييد..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90">
          <div className="text-xs text-slate-400 hidden sm:block">
            {selectedRoles.length > 0 ? (
              <span>
                الأدوار المختارة: <strong>{selectedRoles.map((r) => ROLE_LABELS[r] || r).join(', ')}</strong>
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">تنبيه: لم يتم اختيار أي دور بعد</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ms-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ والاعتماد...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>
                    {status === 'active' ? 'حفظ وتفعيل الحساب' : 'حفظ التعديلات'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
