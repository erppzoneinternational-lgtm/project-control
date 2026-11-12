'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Client,
  Project,
  ProjectStakeholder,
  Stakeholder,
  StakeholderFull,
  RaciRole,
  ProjectClientContact,
  ProjectSubcontractor,
  ProjectSiteResource
} from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import {
  deduplicateEntities,
  deduplicatePeople,
  findCanonicalEntity,
} from '@/lib/directory/entityDirectory';
import { appCache } from '@/lib/cache';
import { toast } from 'sonner';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import { useLanguage } from '@/contexts/LanguageContext';
import { FOCUSED_TEAM_SUBTABS, isFocusedProjectsMode } from '@/lib/config/module-visibility';
import { logger } from '@/lib/logger';
import {
  Users,
  ShieldCheck,
  Crown,
  Wrench,
  Trash2,
  Edit,
  Phone,
  Mail,
  Building2,
  Plus,
  X,
  Loader2,
  Search,
  CheckCircle2,
  UserCheck,
  Check,
  Layers,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  LayoutGrid,
  HardHat,
  Truck,
  List,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { CoreEntitiesBanner } from '@/components/projects/team/CoreEntitiesBanner';
import { isProjectManagerRole } from '@/components/projects/team/ProjectManagerVerificationCard';
import { supabase } from '@/lib/supabase';

interface TeamTabProps {
  project?: Project;
  projectId?: string;
  onProjectUpdated?: () => void;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type NavTabKey = 'all' | 'employee' | 'client_rep' | 'subcontractors' | 'site_resources';

export const RACI_CONFIG: Record<
  RaciRole,
  { letter: string; nameAr: string; nameEn: string; badgeStyle: string; description: string }
> = {
  accountable: {
    letter: 'A',
    nameAr: 'المسؤول الرئيسي',
    nameEn: 'Accountable',
    badgeStyle: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800/80',
    description: 'المسؤول النهائي والمُعتمد للقرارات والمخرجات (عضو واحد فقط)',
  },
  responsible: {
    letter: 'R',
    nameAr: 'المنفذ المباشر',
    nameEn: 'Responsible',
    badgeStyle: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/80',
    description: 'المكلف بتنفيذ المخرجات والمهام المباشرة',
  },
  consulted: {
    letter: 'C',
    nameAr: 'مستشار',
    nameEn: 'Consulted',
    badgeStyle: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800/80',
    description: 'يتم استشارته وأخذ رأيه الفني قبل القرار والتنفيذ',
  },
  informed: {
    letter: 'I',
    nameAr: 'للمتابعة والعلم',
    nameEn: 'Informed',
    badgeStyle: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800/80',
    description: 'يتم إحاطته علماً وإعلامه بمستجدات وتقدم العمل',
  },
};

const TABS_CONFIG = [
  {
    key: 'employee' as NavTabKey,
    titleAr: 'فريق بي زون الداخلي',
    titleEn: 'Pzoneinternational Team',
    subtitle: 'المدراء، المهندسون، المشرفون، والكوادر الفنية والتشغيلية المباشرة',
    icon: ShieldCheck,
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    bgBadgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
    activeBgClass: 'from-emerald-700 to-emerald-800 text-white shadow-emerald-500/20',
  },
  {
    key: 'client_rep' as NavTabKey,
    titleAr: 'ممثلو العميل والمالك والاستشاري',
    titleEn: 'Client, Owner & Consultants',
    subtitle: 'ممثلو مالك المشروع، العميل التعاقدي، استشاريو الإشراف، والخبراء الخارجيون',
    icon: Crown,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgBadgeClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    activeBgClass: 'from-amber-600 to-amber-700 text-white shadow-amber-500/20',
  },
  {
    key: 'subcontractors' as NavTabKey,
    titleAr: 'مقاول الباطن والموردين',
    titleEn: 'Subcontractors & Vendors',
    subtitle: 'مقاولو الباطن المسند لهم أعمال التشييد والتركيبات والتوريدات',
    icon: Wrench,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgBadgeClass: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    activeBgClass: 'from-purple-600 to-purple-700 text-white shadow-purple-500/20',
  },
  {
    key: 'site_resources' as NavTabKey,
    titleAr: 'موارد وعمالة الموقع',
    titleEn: 'Site Resources & Operators',
    subtitle: 'سائقو المعدات، المشغلون، الحراسة، والعمالة المؤقتة بالموقع',
    icon: Users,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgBadgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    activeBgClass: 'from-emerald-600 to-emerald-700 text-white shadow-emerald-500/20',
  },
];

export const TeamTab: React.FC<TeamTabProps> = React.memo(({ project, projectId, onProjectUpdated }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const resolvedProjectId = projectId || project?.id || '';

  // Core data states
  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>([]);
  const [clientContacts, setClientContacts] = useState<ProjectClientContact[]>([]);
  const [subcontractors, setSubcontractors] = useState<ProjectSubcontractor[]>([]);
  const [siteResources, setSiteResources] = useState<ProjectSiteResource[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<NavTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  type DetailViewMode = 'list' | 'cards';
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>('list');
  const [showColPicker, setShowColPicker] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    name: true,
    role: true,
    raci: true,
    level: true,
    phone: false,
    email: false,
    company: false,
  });
  const COL_OPTIONS = [
    { key: 'name', label: isAr ? 'الاسم' : 'Name', locked: true },
    { key: 'role', label: isAr ? 'المسمى الوظيفي' : 'Job Title' },
    { key: 'raci', label: isAr ? 'مصفوفة المسؤوليات' : 'RACI' },
    { key: 'level', label: isAr ? 'المستوى الهيكلي' : 'Level' },
    { key: 'phone', label: isAr ? 'الهاتف' : 'Phone' },
    { key: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email' },
    { key: 'company', label: isAr ? 'الشركة / الجهة' : 'Company' },
  ];

  const { roles: userRoles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly =
    (userRoles || []).length > 0 &&
    (userRoles || []).every((r) => String(r).toLowerCase() === 'viewer') &&
    !isAdmin;
  const canEditStakeholders =
    !isViewerOnly && canEditPath('/projects', userRoles || [], isAdmin, dbAccessRules);

  // Print Preview Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setMemberToRemove(null);
        setIsPrintModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  const [reportEditable, setReportEditable] = useState(false);
  const [reportSections, setReportSections] = useState({
    staff: true,
    client: true,
    subs: true,
    resources: true,
    lifecycle: true,
  });
  const [pmHistory, setPmHistory] = useState<Array<{
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    termination_reason?: string | null;
  }>>([]);

  // Exclude members who left the project (inactive or end_date already passed) from the report
  const isActiveMember = (m: ProjectStakeholder) => {
    const x = m as unknown as { is_active?: boolean | null; end_date?: string | null };
    if (x.is_active === false) return false;
    if (x.end_date && new Date(x.end_date).getTime() <= Date.now()) return false;
    return true;
  };

  // Load PM life cycle (all PMs, current and former) when the report opens
  useEffect(() => {
    if (!isPrintModalOpen || !project?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('project_stakeholders')
        .select('id, project_role, start_date, end_date, is_active, termination_reason, stakeholder:stakeholders(name_ar, name)')
        .eq('project_id', project.id);
      if (cancelled || !data) return;
      const rows = (data as any[])
        .filter((r) => isProjectManagerRole(r.project_role || ''))
        .map((r) => ({
          id: r.id as string,
          name: (r.stakeholder?.name_ar || r.stakeholder?.name || 'غير معروف') as string,
          start_date: r.start_date as string | null,
          end_date: r.end_date as string | null,
          is_active: (r.is_active ?? true) as boolean,
          termination_reason: r.termination_reason as string | null,
        }))
        .sort((a, b) => (a.start_date ? new Date(a.start_date).getTime() : 0) - (b.start_date ? new Date(b.start_date).getTime() : 0));
      setPmHistory(rows);
    })();
    return () => { cancelled = true; };
  }, [isPrintModalOpen, project?.id]);

  // Edit Member Modal states (polymorphic — works for all types)
  type EditMemberType = 'employee' | 'client_stakeholder' | 'client_contact' | 'subcontractor' | 'resource';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMemberType, setEditMemberType] = useState<EditMemberType>('employee');
  const [editingMemberId, setEditingMemberId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<ProjectStakeholder | null>(null);
  const [editProjectRole, setEditProjectRole] = useState('');
  const [editRaciRole, setEditRaciRole] = useState<RaciRole>('responsible');
  const [editCustomLevel, setEditCustomLevel] = useState<number>(0);
  const [editReportsTo, setEditReportsTo] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editTerminationReason, setEditTerminationReason] = useState<string>('');

  const TO_DISCIPLINE_PRESETS = [
    'مهندس مكتب فني - مدني وإنشائي',
    'مهندس مكتب فني - كهروميكانيك مسطحات مائية',
    'مهندس مكتب فني - معماري وتنسيق مواقع',
    'مهندس مكتب فني - حصر كميات ومستخلصات',
    'مدير المكتب الفني',
  ] as const;
  // Client contact edit fields
  const [editContactName, setEditContactName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPartyType, setEditPartyType] = useState<'client' | 'consultant'>('client');
  const [editIsPrimary, setEditIsPrimary] = useState(false);
  // Subcontractor edit fields
  const [editSubCompany, setEditSubCompany] = useState('');
  const [editSubSpecialization, setEditSubSpecialization] = useState('');
  const [editSubScope, setEditSubScope] = useState('');
  const [editSubContractValue, setEditSubContractValue] = useState<number>(0);
  const [editSubRepName, setEditSubRepName] = useState('');
  const [editSubRepPhone, setEditSubRepPhone] = useState('');
  // Resource edit fields
  const [editResName, setEditResName] = useState('');
  const [editResPersonName, setEditResPersonName] = useState('');
  const [editResPhone, setEditResPhone] = useState('');
  const [editResVehicle, setEditResVehicle] = useState('');
  const [editResNotes, setEditResNotes] = useState('');

  // Add Member Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetPartyKind, setTargetPartyKind] = useState<NavTabKey>('employee');
  const [modalTab, setModalTab] = useState<'existing' | 'new'>('existing');

  // Central directories for Add Modal (entities + people)
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [directoryList, setDirectoryList] = useState<StakeholderFull[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<Set<string>>(new Set());
  const [directorySearch, setDirectorySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dynamic Add Form States
  // PZone Employee
  const [projectRole, setProjectRole] = useState('');
  const [raciRole, setRaciRole] = useState<RaciRole>('responsible');
  const [newPersonName, setNewPersonName] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Client/Consultant Contact
  const [contactPartyType, setContactPartyType] = useState<'client' | 'consultant'>('client');
  const [selectedContactEntityId, setSelectedContactEntityId] = useState('');
  const [selectedContactPersonId, setSelectedContactPersonId] = useState('');
  const [contactCompanyName, setContactCompanyName] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);

  // Subcontractor
  const [selectedSubEntityId, setSelectedSubEntityId] = useState('');
  const [subCompanyName, setSubCompanyName] = useState('');
  const [subSpecialization, setSubSpecialization] = useState('');
  const [subScopeOfWork, setSubScopeOfWork] = useState('');
  const [subContractValue, setSubContractValue] = useState<number>(0);
  const [subRepName, setSubRepName] = useState('');
  const [subRepPhone, setSubRepPhone] = useState('');
  const [subRepEmail, setSubRepEmail] = useState('');

  // Site Resource
  const [resType, setResType] = useState<'equipment_operator' | 'driver'>('driver');
  const [resName, setResName] = useState('');
  const [resOperatorName, setResOperatorName] = useState('');
  const [resVehicleType, setResVehicleType] = useState('');
  const [resNotes, setResNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Polymorphic Remove Confirmation State
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
    type: 'employee' | 'client' | 'subcontractor' | 'resource';
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  // Fetch all team categories at once
  const loadAllTeamData = useCallback(async () => {
    if (!resolvedProjectId) return;
    setLoading(true);
    try {
      const [stkData, clientData, subData, siteData] = await Promise.all([
        ProjectService.getProjectStakeholders(resolvedProjectId),
        ProjectService.getProjectClientContacts(resolvedProjectId),
        ProjectService.getProjectSubcontractors(resolvedProjectId),
        ProjectService.getProjectSiteResources(resolvedProjectId),
      ]);
      setStakeholders(stkData || []);
      setClientContacts(clientData || []);
      setSubcontractors(subData || []);
      setSiteResources(siteData || []);
    } catch (err) {
      logger.error('Error loading team sections', { detail: err });
      toast.error('حدث خطأ أثناء تحميل أقسام فريق المشروع المعنية');
    } finally {
      setLoading(false);
    }
  }, [resolvedProjectId]);

  useEffect(() => {
    loadAllTeamData();
  }, [loadAllTeamData]);

  // Open Add modal resetting states dynamically based on tab key
  const handleOpenAddModal = async (targetKind: NavTabKey) => {
    if (!canEditStakeholders) return;
    setIsAddModalOpen(true);
    setTargetPartyKind(targetKind);
    setModalTab(targetKind === 'site_resources' ? 'new' : 'existing');
    setSelectedStakeholderIds(new Set());
    setProjectRole('');
    setRaciRole('responsible');
    setDirectorySearch('');

    // Reset standard PZone inputs
    setNewPersonName('');
    setNewOrgName('');
    setNewPhone('');
    setNewEmail('');

    // Reset Client inputs
    setContactPartyType('client');
    setSelectedContactEntityId(project?.client_id || '');
    setSelectedContactPersonId('');
    setContactCompanyName(project?.client?.name_ar || project?.client_name_raw || '');
    setContactJobTitle('');
    setContactIsPrimary(false);

    // Reset Subcontractor inputs
    setSelectedSubEntityId('');
    setSubCompanyName('');
    setSubSpecialization('');
    setSubScopeOfWork('');
    setSubContractValue(0);
    setSubRepName('');
    setSubRepPhone('');
    setSubRepEmail('');

    // Reset Resource inputs
    setResType('driver');
    setResName('');
    setResOperatorName('');
    setResVehicleType('');
    setResNotes('');

    if (targetKind !== 'site_resources') {
      setLoadingDirectory(true);
      try {
        appCache.invalidate('stakeholders:directory');
        const [clientsData, dir] = await Promise.all([
          ProjectService.getClients(),
          ProjectService.getStakeholdersDirectory({ kind: 'all' }),
        ]);
        setClientsList(clientsData || []);
        setDirectoryList(dir || []);
        if (targetKind === 'employee') {
          const empCount = (dir || []).filter(
            (s) => (s.stakeholder_kind || 'employee') === 'employee'
          ).length;
          if (empCount === 0) {
            setModalTab('new');
          }
        }
      } catch (err) {
        logger.error('Error loading stakeholders & entities directory', { detail: err });
      } finally {
        setLoadingDirectory(false);
      }
    }
  };

  const dedupedEntities = useMemo(() => deduplicateEntities(clientsList), [clientsList]);
  const directoryPeople = useMemo(() => deduplicatePeople(directoryList), [directoryList]);

  const handleEntityCreatedInModal = useCallback((created: Client) => {
    setClientsList((prev) => [created, ...prev]);
  }, []);

  const handlePersonCreatedInModal = useCallback((created: Stakeholder) => {
    const fullPerson: StakeholderFull = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      stakeholder_kind: created.stakeholder_kind || 'employee',
      is_active: true,
      assigned_projects_count: 0,
      ...created,
    };
    setDirectoryList((prev) => [fullPerson, ...prev]);
  }, []);

  // Set of assigned internal stakeholder IDs to prevent duplicate assignments
  const assignedStakeholderIds = useMemo(() => {
    return new Set(stakeholders.map((s) => s.stakeholder_id));
  }, [stakeholders]);

  // Filtered employee candidates
  const availableDirectory = useMemo(() => {
    return directoryPeople
      .filter((item) => (item.stakeholder_kind || 'employee') === 'employee')
      .filter((item) => {
        if (!directorySearch.trim()) return true;
        const q = directorySearch.toLowerCase();
        return (
          (item.name_ar || '').toLowerCase().includes(q) ||
          (item.name_en || '').toLowerCase().includes(q) ||
          (item.role || '').toLowerCase().includes(q) ||
          (item.employee_code || item.code || '').toLowerCase().includes(q) ||
          (item.phone || '').includes(q)
        );
      })
      .sort((a, b) => {
        const aAssigned = assignedStakeholderIds.has(a.id);
        const bAssigned = assignedStakeholderIds.has(b.id);
        if (!aAssigned && bAssigned) return -1;
        if (aAssigned && !bAssigned) return 1;
        return 0;
      });
  }, [directoryPeople, assignedStakeholderIds, directorySearch]);

  // Handle Polymorphic Add Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStakeholders) return;
    setSubmitting(true);

    try {
      if (targetPartyKind === 'employee') {
        if (!projectRole.trim()) {
          toast.error('يرجى تحديد دور العضو في هذا المشروع');
          setSubmitting(false);
          return;
        }

        if (raciRole === 'accountable') {
          const existingAccountable = stakeholders.find((s) => s.raci_role === 'accountable');
          if (existingAccountable) {
            toast.error(isAr ? 'لا يمكن تعيين أكثر من مسؤول رئيسي معتمد واحد للمشروع' : 'Only one Accountable member can be assigned per project');
            setSubmitting(false);
            return;
          }
        }

        if (modalTab === 'existing') {
          if (selectedStakeholderIds.size === 0) {
            toast.error(isAr ? 'يرجى اختيار كادر واحد على الأقل من القائمة' : 'Please select at least one staff member');
            setSubmitting(false);
            return;
          }
          for (const stkId of selectedStakeholderIds) {
            await ProjectService.addProjectStakeholder({
              project_id: resolvedProjectId,
              stakeholder_id: stkId,
              project_role: projectRole.trim(),
              raci_role: raciRole,
              party_kind: 'employee',
            });
          }
        } else {
          if (!newPersonName.trim()) {
            toast.error(isAr ? 'يرجى كتابة اسم الموظف بالكامل' : 'Please enter employee full name');
            setSubmitting(false);
            return;
          }
          await ProjectService.createAndAssignStakeholder({
            name_ar: newPersonName.trim(),
            stakeholder_kind: 'employee',
            organization_name: newOrgName.trim() || (isAr ? 'شركة بي زون إنترناشونال' : 'Pzoneinternational'),
            role: projectRole.trim(),
            phone: newPhone.trim(),
            email: newEmail.trim(),
            project_id: resolvedProjectId,
            project_role: projectRole.trim(),
            raci_role: raciRole,
            party_kind: 'employee',
          });
        }
        toast.success('تم تعيين العضو الداخلي للمشروع بنجاح');
      } else if (targetPartyKind === 'client_rep') {
        const canonicalOrg =
          findCanonicalEntity(dedupedEntities, selectedContactEntityId) ||
          findCanonicalEntity(dedupedEntities, contactCompanyName);
        const resolvedCompanyName = canonicalOrg
          ? isAr
            ? canonicalOrg.displayNameAr
            : canonicalOrg.displayNameEn
          : contactCompanyName.trim();

        if (!newPersonName.trim()) {
          toast.error(isAr ? 'يرجى اختيار أو إدخال اسم الممثل المباشر' : 'Please select or enter the representative name');
          setSubmitting(false);
          return;
        }
        await ProjectService.addProjectClientContact({
          project_id: resolvedProjectId,
          party_type: contactPartyType,
          contact_name: newPersonName.trim(),
          company_name: resolvedCompanyName,
          job_title: contactJobTitle.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim(),
          is_primary: contactIsPrimary,
        });
        toast.success('تم تسجيل جهة اتصال العميل/الاستشاري بنجاح');
      } else if (targetPartyKind === 'subcontractors') {
        const canonicalSub =
          findCanonicalEntity(dedupedEntities, selectedSubEntityId) ||
          findCanonicalEntity(dedupedEntities, subCompanyName);
        const resolvedSubCompany = canonicalSub
          ? isAr
            ? canonicalSub.displayNameAr
            : canonicalSub.displayNameEn
          : subCompanyName.trim();

        if (!resolvedSubCompany) {
          toast.error(isAr ? 'يرجى اختيار شركة مقاول الباطن / المورد من الدليل' : 'Please select the subcontractor/vendor company');
          setSubmitting(false);
          return;
        }
        await ProjectService.addProjectSubcontractor({
          project_id: resolvedProjectId,
          company_name: resolvedSubCompany,
          specialization: subSpecialization.trim(),
          scope_of_work: subScopeOfWork.trim(),
          contract_value: Number(subContractValue),
          rep_name: subRepName.trim(),
          rep_phone: subRepPhone.trim(),
          rep_email: subRepEmail.trim(),
          status: 'active',
        });
        toast.success('تم إضافة مقاول الباطن بنجاح');
      } else if (targetPartyKind === 'site_resources') {
        if (!resName.trim()) {
          toast.error('يرجى تحديد مسمى المورد أو المعدة');
          setSubmitting(false);
          return;
        }
        await ProjectService.addProjectSiteResource({
          project_id: resolvedProjectId,
          resource_type: resType,
          resource_name: resName.trim(),
          person_name: resOperatorName.trim(),
          phone: newPhone.trim(),
          vehicle_equipment_type: resVehicleType.trim(),
          notes: resNotes.trim(),
        });
        toast.success('تم إضافة مورد وعمالة الموقع التشغيلية');
      }

      setIsAddModalOpen(false);
      await loadAllTeamData();
    } catch (err: any) {
      logger.error('Add failed', { detail: err });
      toast.error(err.message || 'حدث خطأ أثناء حفظ السجل للمشروع');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Polymorphic Remove Execution
  const handleConfirmRemove = async () => {
    if (!canEditStakeholders || !memberToRemove) return;
    setRemoving(true);
    try {
      if (memberToRemove.type === 'employee') {
        await ProjectService.removeProjectStakeholder(memberToRemove.id);
      } else if (memberToRemove.type === 'client') {
        await ProjectService.removeProjectClientContact(memberToRemove.id, resolvedProjectId);
      } else if (memberToRemove.type === 'subcontractor') {
        await ProjectService.removeProjectSubcontractor(memberToRemove.id, resolvedProjectId);
      } else if (memberToRemove.type === 'resource') {
        await ProjectService.removeProjectSiteResource(memberToRemove.id, resolvedProjectId);
      }
      toast.success('تمت إزالة السجل من المشروع بنجاح');
      setMemberToRemove(null);
      await loadAllTeamData();
    } catch (err: any) {
      logger.error('Delete failed', { detail: err });
      toast.error(err.message || 'حدث خطأ أثناء إزالة السجل');
    } finally {
      setRemoving(false);
    }
  };

  const handleOpenEditModal = (member: ProjectStakeholder) => {
    if (!canEditStakeholders) return;
    const mAny = member as any;
    setEditMemberType(member.party_kind === 'client_rep' ? 'client_stakeholder' : 'employee');
    setEditingMemberId(member.id);
    setEditingMember(member);
    setEditProjectRole(member.project_role || '');
    setEditRaciRole(member.raci_role || 'responsible');
    setEditCustomLevel(member.custom_level || 0);
    setEditReportsTo(mAny.reports_to || '');
    setEditStartDate(mAny.start_date ? String(mAny.start_date).slice(0, 10) : '');
    setEditEndDate(mAny.end_date ? String(mAny.end_date).slice(0, 10) : '');
    setEditIsActive(mAny.is_active !== false);
    setEditTerminationReason(mAny.termination_reason || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditContact = (contact: ProjectClientContact) => {
    if (!canEditStakeholders) return;
    setEditMemberType('client_contact');
    setEditingMemberId(contact.id);
    setEditingMember(null);
    setEditContactName(contact.contact_name);
    setEditJobTitle(contact.job_title || '');
    setEditCompanyName(contact.company_name || '');
    setEditPhone(contact.phone || '');
    setEditEmail(contact.email || '');
    setEditPartyType(contact.party_type === 'consultant' ? 'consultant' : 'client');
    setEditIsPrimary(contact.is_primary || false);
    setIsEditModalOpen(true);
  };

  const handleOpenEditSub = (sub: ProjectSubcontractor) => {
    if (!canEditStakeholders) return;
    setEditMemberType('subcontractor');
    setEditingMemberId(sub.id);
    setEditingMember(null);
    setEditSubCompany(sub.company_name);
    setEditSubSpecialization(sub.specialization || '');
    setEditSubScope(sub.scope_of_work || sub.scope_description || '');
    setEditSubContractValue(sub.contract_value || 0);
    setEditSubRepName(sub.rep_name || '');
    setEditSubRepPhone(sub.rep_phone || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditResource = (res: ProjectSiteResource) => {
    if (!canEditStakeholders) return;
    setEditMemberType('resource');
    setEditingMemberId(res.id);
    setEditingMember(null);
    setEditResName(res.resource_name);
    setEditResPersonName(res.person_name || '');
    setEditResPhone(res.phone || '');
    setEditResVehicle(res.vehicle_equipment_type || '');
    setEditResNotes(res.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!canEditStakeholders || !resolvedProjectId || !editingMemberId) return;
    setSubmitting(true);
    try {
      if (editMemberType === 'employee' || editMemberType === 'client_stakeholder') {
        await ProjectService.updateProjectStakeholder(editingMember?.id || editingMemberId, resolvedProjectId, {
          project_role: editProjectRole,
          raci_role: editRaciRole,
          custom_level: editCustomLevel > 0 ? editCustomLevel : undefined,
          reports_to: editReportsTo || null,
          start_date: editStartDate || null,
          end_date: editEndDate || null,
          is_active: editIsActive,
          termination_reason: !editIsActive ? (editTerminationReason.trim() || null) : null,
        } as any);
      } else if (editMemberType === 'client_contact') {
        await ProjectService.updateProjectClientContact(editingMemberId, resolvedProjectId, {
          contact_name: editContactName,
          job_title: editJobTitle,
          company_name: editCompanyName,
          phone: editPhone,
          email: editEmail,
          party_type: editPartyType,
          is_primary: editIsPrimary,
        });
      } else if (editMemberType === 'subcontractor') {
        await ProjectService.updateProjectSubcontractor(editingMemberId, resolvedProjectId, {
          company_name: editSubCompany,
          specialization: editSubSpecialization,
          scope_of_work: editSubScope,
          contract_value: editSubContractValue,
          rep_name: editSubRepName,
          rep_phone: editSubRepPhone,
        });
      } else if (editMemberType === 'resource') {
        await ProjectService.updateProjectSiteResource(editingMemberId, resolvedProjectId, {
          resource_name: editResName,
          person_name: editResPersonName,
          phone: editResPhone,
          vehicle_equipment_type: editResVehicle,
          notes: editResNotes,
        });
      }
      toast.success('تم تحديث البيانات بنجاح');
      setIsEditModalOpen(false);
      loadAllTeamData();
    } catch (err: any) {
      logger.error('Update failed', { detail: err });
      toast.error(err.message || 'فشل تحديث البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  // Global search filtering
  const filterList = <T extends Record<string, any>>(list: T[], fields: (keyof T)[]): T[] => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      fields.some((field) => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  };

  const filterStakeholders = (list: ProjectStakeholder[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const name = (item.stakeholder?.name_ar || '').toLowerCase();
      const job = (item.stakeholder?.role || '').toLowerCase();
      const role = (item.project_role || '').toLowerCase();
      const phone = (item.stakeholder?.phone || '').toLowerCase();
      const email = (item.stakeholder?.email || '').toLowerCase();
      const org = (item.stakeholder?.organization_name || '').toLowerCase();
      return (
        name.includes(q) ||
        job.includes(q) ||
        role.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        org.includes(q)
      );
    });
  };

  const filteredEmployees = useMemo(() => {
    const list = [...stakeholders.filter(
      (item) => (item.party_kind || item.stakeholder?.stakeholder_kind || 'employee') === 'employee'
    )];

    const pmName = project?.pm_full_name || project?.project_manager_name_raw || project?.project_manager;
    if (pmName && pmName.trim()) {
      const cleanPmName = pmName.trim();
      const exists = list.some(
        (item) =>
          item.stakeholder?.name_ar?.trim() === cleanPmName ||
          item.stakeholder?.name_en?.trim() === cleanPmName ||
          item.project_role?.includes(cleanPmName)
      );
      if (!exists) {
        list.unshift({
          id: `pm-virtual-${project?.id || 'main'}`,
          project_id: project?.id || '',
          stakeholder_id: `pm-sh-${project?.id || 'main'}`,
          project_role: 'مدير المشروع',
          raci_role: 'accountable',
          custom_level: 2,
          stakeholder: {
            id: `pm-sh-${project?.id || 'main'}`,
            name_ar: cleanPmName,
            name_en: cleanPmName,
            role: 'مدير المشروع',
            stakeholder_kind: 'employee',
            is_active: true,
          },
        } as ProjectStakeholder);
      }
    }

    return filterStakeholders(list);
  }, [stakeholders, searchQuery, project]);

  const clientStakeholders = useMemo(() => {
    return stakeholders.filter(
      (item) => (item.party_kind || item.stakeholder?.stakeholder_kind) === 'client_rep'
    );
  }, [stakeholders]);

  const filteredClientStakeholders = useMemo(() => {
    return filterStakeholders(clientStakeholders);
  }, [clientStakeholders, searchQuery]);

  // Categorize Pzoneinternational employees into 4 structural levels
  const employeeLevels = useMemo(() => {
    const levels = {
      executive: [] as ProjectStakeholder[],
      management: [] as ProjectStakeholder[],
      technical: [] as ProjectStakeholder[],
      operations: [] as ProjectStakeholder[],
    };

    filteredEmployees.forEach((item) => {
      const role = (item.project_role || '').toLowerCase();
      const jobTitle = (item.stakeholder?.role || '').toLowerCase();
      const isAccountable = item.raci_role === 'accountable';

      // Level 1: Executive / Sector Management / COO / Projects Director
      const isExecutive = 
        role.includes('مدير المشروعات') ||
        role.includes('coo') ||
        role.includes('ceo') ||
        role.includes('director') ||
        role.includes('sector') ||
        role.includes('قطاع') ||
        jobTitle.includes('director') ||
        jobTitle.includes('coo') ||
        jobTitle.includes('ceo') ||
        jobTitle.includes('chairman') ||
        jobTitle.includes('general manager') ||
        jobTitle.includes('نائب رئيس') ||
        jobTitle.includes('رئيس مجلس');

      // Level 2: Project Management / Direct Execution Management
      const isManagement = 
        role.includes('مدير المشروع') ||
        role.includes('project manager') ||
        role.includes('مدير التنفيذ') ||
        role.includes('construction manager') ||
        role.includes('site manager') ||
        role.includes('مدير الموقع') ||
        jobTitle.includes('manager') ||
        isAccountable;

      // Level 3: Technical & Engineering Team
      const isTechnical = 
        role.includes('مهندس') ||
        role.includes('engineer') ||
        role.includes('مكتب فني') ||
        role.includes('تصميم') ||
        role.includes('dce') ||
        jobTitle.includes('engineer') ||
        jobTitle.includes('architect') ||
        jobTitle.includes('designer') ||
        jobTitle.includes('controller') ||
        role.includes('controller');

      if (item.custom_level === 1) {
        levels.executive.push(item);
      } else if (item.custom_level === 2) {
        levels.management.push(item);
      } else if (item.custom_level === 3) {
        levels.technical.push(item);
      } else if (item.custom_level === 4) {
        levels.operations.push(item);
      } else if (isExecutive) {
        levels.executive.push(item);
      } else if (isManagement) {
        levels.management.push(item);
      } else if (isTechnical) {
        levels.technical.push(item);
      } else {
        levels.operations.push(item);
      }
    });

    return levels;
  }, [filteredEmployees]);

  const filteredClientContacts = useMemo(() => {
    return filterList(clientContacts, ['contact_name', 'company_name', 'job_title', 'phone', 'email']);
  }, [clientContacts, searchQuery]);

  const filteredSubcontractors = useMemo(() => {
    return filterList(subcontractors, ['company_name', 'specialization', 'scope_of_work', 'rep_name']);
  }, [subcontractors, searchQuery]);

  const filteredSiteResources = useMemo(() => {
    return filterList(siteResources, ['resource_name', 'person_name', 'vehicle_equipment_type']);
  }, [siteResources, searchQuery]);

  // Format currency helpers
  const formatCurrency = (val?: number) => {
    if (!val) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // Clean Standalone Report Printing & PDF Export (100% HTML-escaped data — zero raw DOM injection)
  const handlePrintCleanReport = () => {
    const printWin = window.open('', '_blank', 'width=950,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    const safeProjectName = escapeHtml(project?.project_name_ar || project?.project_name || '');
    const safeProjectCode = escapeHtml(project?.project_code || project?.id || '');
    const safeOwner = escapeHtml(project?.client_name_raw || '—');
    const safePrintDate = escapeHtml(new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US'));

    let staffCounter = 0;
    const renderStaffRows = (items: ProjectStakeholder[], levelLabel: string) =>
      items
        .filter(isActiveMember)
        .map((e) => {
          staffCounter++;
          const raciLabel = escapeHtml(RACI_CONFIG[e.raci_role]?.nameAr || '');
          return `<tr>
            <td style="text-align:center;font-family:monospace;font-weight:700;">${staffCounter}</td>
            <td style="font-weight:700;">${escapeHtml(e.stakeholder?.name_ar || '')}</td>
            <td>${escapeHtml(e.project_role || '')}</td>
            <td>${escapeHtml(e.stakeholder?.role || '')}</td>
            <td dir="ltr" style="font-family:monospace;">${escapeHtml(e.stakeholder?.phone || '-')}</td>
            <td style="font-weight:700;">${raciLabel} (${escapeHtml(levelLabel)})</td>
          </tr>`;
        })
        .join('');

    const staffHtml =
      reportSections.staff && stakeholders.length > 0
        ? `<div style="margin-bottom:18px;">
            <h3 style="font-size:12px;font-weight:900;background:#f1f5f9;padding:8px;border-right:4px solid #065f46;margin:0 0 6px 0;">
              ${escapeHtml(isAr ? 'أولاً: هيكل فريق عمل بي زون الداخلي' : '1. PZone Internal Team Structure')}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center;width:40px;">${escapeHtml(isAr ? 'م' : 'No.')}</th>
                  <th>${escapeHtml(isAr ? 'الاسم' : 'Name')}</th>
                  <th>${escapeHtml(isAr ? 'الدور في المشروع' : 'Role in Project')}</th>
                  <th>${escapeHtml(isAr ? 'المسمى الوظيفي بالموارد البشرية' : 'HR Job Title')}</th>
                  <th>${escapeHtml(isAr ? 'الهاتف' : 'Phone')}</th>
                  <th>${escapeHtml(isAr ? 'مصفوفة المسؤوليات (RACI)' : 'RACI Role')}</th>
                </tr>
              </thead>
              <tbody>
                ${renderStaffRows(employeeLevels.executive, isAr ? 'الإدارة العليا' : 'Executive')}
                ${renderStaffRows(employeeLevels.management, isAr ? 'إدارة المشروع' : 'Management')}
                ${renderStaffRows(employeeLevels.technical, isAr ? 'الفريق الفني' : 'Technical')}
                ${renderStaffRows(employeeLevels.operations, isAr ? 'التشغيل والعمليات' : 'Operations')}
              </tbody>
            </table>
          </div>`
        : '';

    const clientHtml =
      reportSections.client && clientContacts.length > 0
        ? `<div style="margin-bottom:18px;">
            <h3 style="font-size:12px;font-weight:900;background:#f1f5f9;padding:8px;border-right:4px solid #d97706;margin:0 0 6px 0;">
              ${escapeHtml(isAr ? 'ثانياً: ممثلو العميل واستشاري المشروع' : '2. Client & Consultant Representatives')}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center;width:40px;">${escapeHtml(isAr ? 'م' : 'No.')}</th>
                  <th>${escapeHtml(isAr ? 'الاسم' : 'Name')}</th>
                  <th>${escapeHtml(isAr ? 'الصفة' : 'Role / Party')}</th>
                  <th>${escapeHtml(isAr ? 'الجهة / الشركة' : 'Company / Entity')}</th>
                  <th>${escapeHtml(isAr ? 'المسمى الوظيفي' : 'Job Title')}</th>
                  <th>${escapeHtml(isAr ? 'الهاتف' : 'Phone')}</th>
                </tr>
              </thead>
              <tbody>
                ${clientContacts
                  .map(
                    (c, idx) => `<tr>
                      <td style="text-align:center;font-family:monospace;font-weight:700;">${idx + 1}</td>
                      <td style="font-weight:700;">${escapeHtml(c.contact_name)}</td>
                      <td style="font-weight:700;">${escapeHtml(c.party_type === 'client' ? (isAr ? 'ممثلو العميل' : 'Client Representatives') : isAr ? 'استشاري المشروع' : 'Project Consultant')}</td>
                      <td>${escapeHtml(c.company_name || '-')}</td>
                      <td>${escapeHtml(c.job_title || '-')}</td>
                      <td dir="ltr" style="font-family:monospace;">${escapeHtml(c.phone || '-')}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : '';

    const subsHtml =
      reportSections.subs && subcontractors.length > 0
        ? `<div style="margin-bottom:18px;">
            <h3 style="font-size:12px;font-weight:900;background:#f1f5f9;padding:8px;border-right:4px solid #9333ea;margin:0 0 6px 0;">
              ${escapeHtml(isAr ? 'ثالثاً: مقاولو الباطن المسند لهم أعمال' : '3. Assigned Subcontractors')}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center;width:40px;">${escapeHtml(isAr ? 'م' : 'No.')}</th>
                  <th>${escapeHtml(isAr ? 'الشركة / مقاول الباطن' : 'Subcontractor / Company')}</th>
                  <th>${escapeHtml(isAr ? 'التخصص' : 'Specialization')}</th>
                  <th>${escapeHtml(isAr ? 'نطاق الأعمال المسند' : 'Assigned Scope of Work')}</th>
                  <th>${escapeHtml(isAr ? 'قيمة العقد' : 'Contract Value')}</th>
                  <th>${escapeHtml(isAr ? 'ممثل المقاول' : 'Subcontractor Rep')}</th>
                  <th>${escapeHtml(isAr ? 'هاتف الممثل' : 'Rep Phone')}</th>
                </tr>
              </thead>
              <tbody>
                ${subcontractors
                  .map(
                    (s, idx) => `<tr>
                      <td style="text-align:center;font-family:monospace;font-weight:700;">${idx + 1}</td>
                      <td style="font-weight:700;">${escapeHtml(s.company_name)}</td>
                      <td>${escapeHtml(s.specialization || (isAr ? 'عام' : 'General'))}</td>
                      <td>${escapeHtml(s.scope_of_work || s.scope_description || '-')}</td>
                      <td style="font-family:monospace;font-weight:700;">${escapeHtml(formatCurrency(s.contract_value))}</td>
                      <td>${escapeHtml(s.rep_name || '-')}</td>
                      <td dir="ltr" style="font-family:monospace;">${escapeHtml(s.rep_phone || '-')}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : '';

    const resourcesHtml =
      reportSections.resources && siteResources.length > 0
        ? `<div style="margin-bottom:18px;">
            <h3 style="font-size:12px;font-weight:900;background:#f1f5f9;padding:8px;border-right:4px solid #059669;margin:0 0 6px 0;">
              ${escapeHtml(isAr ? 'رابعاً: الكوادر والعمالة ومعدات الموقع' : '4. Site Personnel & Equipment Resources')}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center;width:40px;">${escapeHtml(isAr ? 'م' : 'No.')}</th>
                  <th>${escapeHtml(isAr ? 'مسمى المورد / الوظيفة' : 'Resource Name / Job')}</th>
                  <th>${escapeHtml(isAr ? 'الفئة' : 'Category')}</th>
                  <th>${escapeHtml(isAr ? 'اسم الكادر / المشغل' : 'Operator / Driver Name')}</th>
                  <th>${escapeHtml(isAr ? 'رقم الهاتف' : 'Phone')}</th>
                  <th>${escapeHtml(isAr ? 'المعدة / المركبة' : 'Equipment / Vehicle')}</th>
                </tr>
              </thead>
              <tbody>
                ${siteResources
                  .map(
                    (r, idx) => `<tr>
                      <td style="text-align:center;font-family:monospace;font-weight:700;">${idx + 1}</td>
                      <td style="font-weight:700;">${escapeHtml(r.resource_name)}</td>
                      <td>${escapeHtml(r.resource_type === 'driver' ? (isAr ? 'سائق معدة' : 'Driver') : isAr ? 'فني تشغيل' : 'Operations Tech')}</td>
                      <td>${escapeHtml(r.person_name || '-')}</td>
                      <td dir="ltr" style="font-family:monospace;">${escapeHtml(r.phone || '-')}</td>
                      <td>${escapeHtml(r.vehicle_equipment_type || '-')}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : '';

    const lifecycleHtml =
      reportSections.lifecycle && pmHistory.length > 0
        ? `<div style="margin-bottom:18px;">
            <h3 style="font-size:12px;font-weight:900;background:#f1f5f9;padding:8px;border-right:4px solid #4f46e5;margin:0 0 6px 0;">
              ${escapeHtml(isAr ? 'خامساً: السجل التاريخي ودورة حياة مديري المشروع' : '5. Project Manager Life Cycle History')}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align:center;width:40px;">${escapeHtml(isAr ? 'م' : 'No.')}</th>
                  <th>${escapeHtml(isAr ? 'الاسم' : 'Name')}</th>
                  <th>${escapeHtml(isAr ? 'من تاريخ' : 'Start Date')}</th>
                  <th>${escapeHtml(isAr ? 'إلى تاريخ' : 'End Date')}</th>
                  <th>${escapeHtml(isAr ? 'الحالة' : 'Status')}</th>
                  <th>${escapeHtml(isAr ? 'سبب التغيير' : 'Reason for Change')}</th>
                </tr>
              </thead>
              <tbody>
                ${pmHistory
                  .map(
                    (h, idx) => `<tr>
                      <td style="text-align:center;font-family:monospace;font-weight:700;">${idx + 1}</td>
                      <td style="font-weight:700;">${escapeHtml(h.name)}</td>
                      <td style="font-family:monospace;">${escapeHtml(h.start_date || (isAr ? 'بداية المشروع' : 'Project Start'))}</td>
                      <td style="font-family:monospace;">${escapeHtml(h.end_date || (h.is_active ? (isAr ? 'حتى الآن' : 'Present') : '-'))}</td>
                      <td style="font-weight:700;">${escapeHtml(h.is_active ? (isAr ? 'الحالي' : 'Current') : isAr ? 'سابق' : 'Former')}</td>
                      <td>${escapeHtml(h.termination_reason || '-')}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير فريق العمل للمشروع - ${safeProjectName}</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0;
              padding: 15px;
              direction: rtl;
              text-align: right;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 7px 10px;
              text-align: right;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 800;
              color: #0f172a;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            .header-box {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div style="font-size:18px;font-weight:900;color:#0f172a;">PZONE INTERNATIONAL</div>
              <div style="font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(isAr ? 'جدول فريق العمل والموارد ومقاولي الباطن للمشروع' : 'Project Team, Resources & Subcontractors Schedule')}</div>
              <div style="font-size:12px;margin-top:4px;">${escapeHtml(isAr ? 'المشروع:' : 'Project:')} <strong>${safeProjectName}</strong></div>
            </div>
            <div dir="ltr" style="font-family:monospace;font-size:11px;text-align:left;">
              <div><strong>Code:</strong> #${safeProjectCode}</div>
              <div><strong>Date:</strong> ${safePrintDate}</div>
              <div><strong>Owner:</strong> ${safeOwner}</div>
            </div>
          </div>
          ${staffHtml}
          ${clientHtml}
          ${subsHtml}
          ${resourcesHtml}
          ${lifecycleHtml}
          <div style="padding-top:12px;border-top:1px solid #cbd5e1;font-size:10px;color:#64748b;display:flex;justify-content:space-between;font-family:monospace;">
            <div>PZONE INTERNATIONAL — PROJECT MANAGEMENT PORTAL</div>
            <div>OFFICIAL EXECUTIVE REPORT</div>
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2 lg:col-span-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Core Contractual Entities Hub */}
      {project && (
        <div className="print:hidden">
          <CoreEntitiesBanner
            project={project}
            onProjectUpdated={() => {
              loadAllTeamData();
              if (onProjectUpdated) onProjectUpdated();
            }}
            canEdit={canEditStakeholders}
            isAr={isAr}
          />
        </div>
      )}

      {/* Screen Toolbar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 shadow-xs print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isFocusedProjectsMode()
                ? (isAr ? 'هيكل فريق العمل وممثلي العميل ومقاولي الباطن' : 'Project Team, Client Reps & Subcontractors')
                : (isAr ? 'هيكل فريق العمل والموارد ومقاولي الباطن' : 'Project Team, Resources & Subcontractors')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              {isFocusedProjectsMode()
                ? stakeholders.length + clientContacts.length + subcontractors.length
                : stakeholders.length + clientContacts.length + subcontractors.length + siteResources.length}{' '}
              {isAr ? 'إجمالي السجلات' : 'Total Records'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isFocusedProjectsMode()
              ? (isAr ? 'إدارة وتنسيق الكوادر الداخلية وممثلي المالك والاستشاري ومقاولي الباطن للمشروع' : 'Coordinate internal staff, client/consultant representatives, and subcontractors for this project')
              : (isAr ? 'إدارة وتنسيق الكوادر الداخلية والعملاء ومقاولي الباطن المباشرين للمشروع' : 'Coordinate internal staff, clients, and direct subcontractors for this project')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isFocusedProjectsMode() && canEditStakeholders && (
            <Link
              href="/technical-office?tab=team_assignment"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs border border-emerald-200 dark:border-emerald-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isAr ? 'الانتقال إلى لوحة توزيع مهام المكتب الفني على طاقم هذا المشروع' : 'Go to Technical Office task assignment for this project team'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'توزيع مهام المكتب الفني لطاقم المشروع' : 'TO Task Assignment'}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs border border-slate-300 dark:border-slate-700 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
            title={isAr ? "فتح شاشة التقرير التنفيذي الرسمي الموفر للحبر والجاهز للطباعة وتنزيل ملف PDF" : "Open executive printable report and PDF download"}
          >
            <Printer className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{isAr ? 'طباعة التقرير التنفيذي (ملف PDF)' : 'Print Executive Report (PDF)'}</span>
          </button>

          {canEditStakeholders && (
            <button
              type="button"
              onClick={() => handleOpenAddModal(activeTab === 'all' ? 'employee' : activeTab)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-purple-600 hover:from-emerald-800 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة وتعيين جديد' : 'Add New Member'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid (Hidden on Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start print:hidden">
        {/* Right Tab Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between">
            <span>{isAr ? 'دليل الفئات والمقاولين' : 'Categories Directory'}</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Tab: All */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`w-full p-2.5 rounded-xl text-end transition-all cursor-pointer flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white font-black shadow-md'
                : 'hover:bg-slate-100 dark:bg-slate-800/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-2 rounded-lg ${activeTab === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300'}`}>
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-end">
                <div className="text-xs font-bold truncate">{isAr ? 'لوحة الفريق والجهات (الكل)' : 'All Parties & Team'}</div>
                <div className={`text-[9px] truncate ${activeTab === 'all' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {isAr ? 'نظرة شمولية لكافة الأطراف' : 'Comprehensive Overview'}
                </div>
              </div>
            </div>
          </button>

          {(isFocusedProjectsMode()
            ? TABS_CONFIG.filter((t) => (FOCUSED_TEAM_SUBTABS as readonly string[]).includes(t.key))
            : TABS_CONFIG
          ).map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            let count = 0;
            if (t.key === 'employee') count = stakeholders.filter(s => (s.party_kind || s.stakeholder?.stakeholder_kind || 'employee') === 'employee').length;
            if (t.key === 'client_rep') count = clientContacts.length + clientStakeholders.length;
            if (t.key === 'subcontractors') count = subcontractors.length;
            if (t.key === 'site_resources') count = siteResources.length;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`w-full p-2.5 rounded-xl text-right transition-all cursor-pointer flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? `bg-gradient-to-r ${t.activeBgClass} font-black shadow-md`
                    : 'hover:bg-slate-100 dark:bg-slate-800/80 dark:bg-slate-800/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white dark:bg-slate-900/20' : t.bgBadgeClass}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : t.colorClass}`} />
                  </div>
                  <div className="min-w-0 text-end">
                    <div className="text-xs font-bold truncate">{isAr ? t.titleAr : t.titleEn}</div>
                    <div className={`text-[9px] truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {isAr ? t.subtitle : t.titleEn}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Left Side Content Area — Kanban Board */}
        <div className="lg:col-span-3 space-y-3">
          {/* Search + View Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تصفية بالاسم، المسمى، الهاتف، الشركة..."
                className="w-full pe-9 ps-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* View Mode Toggle — only for single category */}
            {activeTab !== 'all' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${detailViewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                  title="عرض قائمة"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${detailViewMode === 'cards' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                  title="عرض بطاقات"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Column Picker — only for single category */}
            {activeTab !== 'all' && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowColPicker(!showColPicker)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  الأعمدة
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showColPicker && (
                  <div className="absolute start-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 min-w-[160px] space-y-0.5">
                    {COL_OPTIONS.map((col) => (
                      <label
                        key={col.key}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          col.locked ? 'text-slate-400 cursor-not-allowed' : visibleCols[col.key] ? 'text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {col.locked ? (
                          <Eye className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <button type="button" onClick={() => setVisibleCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} className="cursor-pointer">
                            {visibleCols[col.key] ? <Eye className="w-3 h-3 text-emerald-500" /> : <EyeOff className="w-3 h-3 text-slate-300" />}
                          </button>
                        )}
                        {col.label}
                      </label>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                      <button type="button" onClick={() => setShowColPicker(false)} className="w-full text-center text-[10px] text-emerald-700 dark:text-emerald-300 font-bold py-1 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/30 rounded-lg cursor-pointer">إغلاق</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 tabular-nums">
              {isFocusedProjectsMode()
                ? filteredEmployees.length + filteredClientStakeholders.length + filteredClientContacts.length + filteredSubcontractors.length
                : filteredEmployees.length + filteredClientStakeholders.length + filteredClientContacts.length + filteredSubcontractors.length + filteredSiteResources.length}{' '}
              سجل
            </span>
          </div>

          {/* Kanban Columns */}
          <div className={`grid gap-3 items-start ${
            activeTab === 'all'
              ? isFocusedProjectsMode()
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>

            {/* ═══ Column 1: PZone Internal Team ═══ */}
            {(activeTab === 'all' || activeTab === 'employee') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs">
                <div className="sticky top-0 z-10 px-3 py-2 border-b border-emerald-200 dark:border-emerald-950 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    <span className="text-[11px] font-black text-emerald-950 dark:text-emerald-300">
                      {isAr ? 'فريق عمل بي زون الداخلي' : 'Pzone Internal Team'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 tabular-nums">{filteredEmployees.length}</span>
                    {canEditStakeholders && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('employee')}
                        className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title={isAr ? 'إضافة عضو فريق' : 'Add Team Member'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className={`overflow-y-auto ${activeTab === 'all' ? 'max-h-[70vh]' : 'max-h-[80vh]'}`}>
                  {filteredEmployees.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-400">{isAr ? 'لا يوجد أعضاء' : 'No members found'}</div>
                  ) : detailViewMode === 'cards' && activeTab !== 'all' ? (
                    /* ── Cards Grid View ── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
                      {filteredEmployees.map((item) => {
                        const itemAny = item as any;
                        const managerObj = itemAny.reports_to
                          ? stakeholders.find(
                              (s) => s.id === itemAny.reports_to || s.stakeholder_id === itemAny.reports_to
                            )
                          : null;
                        const managerName = managerObj?.stakeholder?.name_ar;

                        return (
                          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group relative focus-within:ring-2 focus-within:ring-emerald-500/40">
                            <div className="flex items-start gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                                {item.stakeholder?.name_ar?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-[12px] leading-tight truncate">{item.stakeholder?.name_ar}</div>
                                {visibleCols.role && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.project_role}</div>}
                              </div>
                              {visibleCols.raci && (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0 ${RACI_CONFIG[item.raci_role]?.badgeStyle}`}>{RACI_CONFIG[item.raci_role]?.letter}</span>
                              )}
                            </div>
                            <div className="mt-2.5 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                              {visibleCols.level && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.custom_level === 1 ? (isAr ? 'الإدارة العليا' : 'Executive') : item.custom_level === 2 ? (isAr ? 'إدارة المشروع' : 'Project Management') : item.custom_level === 3 ? (isAr ? 'الفريق الفني' : 'Technical') : (isAr ? 'العمليات' : 'Operations')}</span>
                                </div>
                              )}
                              {visibleCols.phone && item.stakeholder?.phone && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span dir="ltr">{item.stakeholder.phone}</span>
                                </div>
                              )}
                              {visibleCols.email && item.stakeholder?.email && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span dir="ltr" className="truncate">{item.stakeholder.email}</span>
                                </div>
                              )}
                              {visibleCols.company && item.stakeholder?.organization_name && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.stakeholder.organization_name}</span>
                                </div>
                              )}
                              {(itemAny.reports_to || itemAny.end_date || itemAny.is_active === false) && (
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                  {itemAny.reports_to && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70">
                                      {isAr ? `يتبع: ${managerName || 'مدير مباشر'}` : `Reports to: ${managerName || 'Manager'}`}
                                    </span>
                                  )}
                                  {itemAny.end_date && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 font-mono">
                                      {isAr ? `ينتهي: ${String(itemAny.end_date).slice(0, 10)}` : `Ends: ${String(itemAny.end_date).slice(0, 10)}`}
                                    </span>
                                  )}
                                  {itemAny.is_active === false && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
                                      {isAr ? 'غير نشط' : 'Inactive'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Action buttons */}
                            {canEditStakeholders && (
                              <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                  title={isAr ? 'تعديل بيانات العضو' : 'Edit Member'}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMemberToRemove({ id: item.id, name: item.stakeholder?.name_ar || '', type: 'employee' })}
                                  className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                  title={isAr ? 'إزالة من المشروع' : 'Remove from Project'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Grouped List View ── */
                    <>
                      {/* Grouped by level: Executive → Management → Technical → Operations */}
                      {([
                        { key: 'executive' as const, label: 'الإدارة العليا والقطاع', labelEn: 'Executive & Sector', headerStyle: 'bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
                        { key: 'management' as const, label: 'إدارة المشروع المباشرة', labelEn: 'Project Management', headerStyle: 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
                        { key: 'technical' as const, label: 'الفريق الفني والهندسي', labelEn: 'Technical & Engineering', headerStyle: 'bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
                        { key: 'operations' as const, label: 'العمليات والدعم الميداني', labelEn: 'Operations & Support', headerStyle: 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
                      ] as const).map((lvl) => {
                        const items = employeeLevels[lvl.key];
                        if (items.length === 0) return null;
                        return (
                          <div key={lvl.key}>
                            <div className={`px-2.5 py-1 ${lvl.headerStyle} text-[9px] font-bold tracking-normal flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                              {isAr ? lvl.label : lvl.labelEn} ({items.length})
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {items.map((item) => {
                                const itemAny = item as any;
                                const managerObj = itemAny.reports_to
                                  ? stakeholders.find(
                                      (s) => s.id === itemAny.reports_to || s.stakeholder_id === itemAny.reports_to
                                    )
                                  : null;
                                const managerName = managerObj?.stakeholder?.name_ar;

                                return (
                                  <div key={item.id} className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[8px] font-black shrink-0">
                                      {item.stakeholder?.name_ar?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{item.stakeholder?.name_ar}</div>
                                      {visibleCols.role && <div className="text-[9px] text-slate-400 leading-tight">{item.project_role}</div>}
                                      {(itemAny.reports_to || itemAny.end_date || itemAny.is_active === false) && (
                                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                          {itemAny.reports_to && (
                                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70">
                                              {isAr ? `يتبع: ${managerName || 'مدير مباشر'}` : `Reports to: ${managerName || 'Manager'}`}
                                            </span>
                                          )}
                                          {itemAny.end_date && (
                                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 font-mono">
                                              {isAr ? `ينتهي: ${String(itemAny.end_date).slice(0, 10)}` : `Ends: ${String(itemAny.end_date).slice(0, 10)}`}
                                            </span>
                                          )}
                                          {itemAny.is_active === false && (
                                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
                                              {isAr ? 'غير نشط' : 'Inactive'}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {visibleCols.raci && <span className={`px-1 py-0.5 rounded text-[8px] font-bold border shrink-0 ${RACI_CONFIG[item.raci_role]?.badgeStyle}`}>{RACI_CONFIG[item.raci_role]?.letter}</span>}
                                    {visibleCols.level && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lvl.dot}`} />}
                                    {visibleCols.phone && item.stakeholder?.phone && <span className="text-[9px] text-slate-400 shrink-0 tabular-nums" dir="ltr">{item.stakeholder.phone}</span>}
                                    {visibleCols.email && item.stakeholder?.email && <span className="text-[9px] text-slate-400 shrink-0 truncate max-w-[120px]" dir="ltr">{item.stakeholder.email}</span>}
                                    {canEditStakeholders && (
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditModal(item)}
                                          className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                          title={isAr ? 'تعديل بيانات العضو' : 'Edit Member'}
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setMemberToRemove({ id: item.id, name: item.stakeholder?.name_ar || '', type: 'employee' })}
                                          className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                          title={isAr ? 'إزالة من المشروع' : 'Remove from Project'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ═══ Column 2: Client & Consultants ═══ */}
            {(activeTab === 'all' || activeTab === 'client_rep') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs">
                <div className="sticky top-0 z-10 px-3 py-2 border-b border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/40 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-300">
                      {isAr ? 'العميل واستشاري المشروع' : 'Client & Consultants'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 tabular-nums">{filteredClientStakeholders.length + filteredClientContacts.length}</span>
                    {canEditStakeholders && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('client_rep')}
                        className="p-1 rounded-md text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100/50 dark:bg-amber-900/40 dark:hover:bg-amber-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title={isAr ? 'تسجيل جهة اتصال جديدة' : 'Add Contact'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className={`overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 ${activeTab === 'all' ? 'max-h-[70vh]' : 'max-h-[80vh]'}`}>
                  {/* Sub-section: Client Stakeholders */}
                  {filteredClientStakeholders.length > 0 && (
                    <>
                      <div className="px-2.5 py-1 bg-amber-50/50 dark:bg-amber-950/20 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {isAr ? `أصحاب المصلحة (${filteredClientStakeholders.length})` : `Stakeholders (${filteredClientStakeholders.length})`}
                      </div>
                      {filteredClientStakeholders.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs transition-colors">
                          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[8px] font-black shrink-0">
                            {item.stakeholder?.name_ar?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{item.stakeholder?.name_ar}</div>
                            <div className="text-[9px] text-slate-400 leading-tight">{item.stakeholder?.organization_name}</div>
                          </div>
                          <span className={`px-1 py-0.5 rounded text-[8px] font-bold border shrink-0 ${RACI_CONFIG[item.raci_role]?.badgeStyle}`}>{RACI_CONFIG[item.raci_role]?.letter}</span>
                          {canEditStakeholders && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                title={isAr ? 'تعديل البيانات' : 'Edit'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberToRemove({ id: item.id, name: item.stakeholder?.name_ar || '', type: 'employee' })}
                                className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                title={isAr ? 'إزالة' : 'Remove'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {/* Sub-section: Direct Contacts */}
                  {filteredClientContacts.length > 0 && (
                    <>
                      <div className="px-2.5 py-1 bg-sky-50/50 dark:bg-sky-950/20 text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        {isAr ? `جهات التنسيق المباشر (${filteredClientContacts.length})` : `Direct Contacts (${filteredClientContacts.length})`}
                      </div>
                      {filteredClientContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs transition-colors">
                          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[8px] font-black shrink-0">
                            {contact.contact_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{contact.contact_name}</span>
                              {contact.is_primary && (
                                <span className="text-[7px] font-bold px-1 py-0 rounded bg-red-100 dark:bg-red-900/40 text-red-600 border border-red-200 dark:border-red-800/50 shrink-0">
                                  {isAr ? 'رئيسي' : 'Primary'}
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate leading-tight">{contact.company_name} · {contact.job_title}</div>
                          </div>
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 shrink-0">
                            {contact.party_type === 'consultant' ? (isAr ? 'استشاري' : 'Consultant') : (isAr ? 'عميل' : 'Client')}
                          </span>
                          {canEditStakeholders && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditContact(contact)}
                                className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                title={isAr ? 'تعديل جهة الاتصال' : 'Edit Contact'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberToRemove({ id: contact.id, name: contact.contact_name, type: 'client' })}
                                className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                title={isAr ? 'إزالة' : 'Remove'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {filteredClientStakeholders.length === 0 && filteredClientContacts.length === 0 && (
                    <div className="py-8 text-center text-[10px] text-slate-400">
                      {isAr ? 'لا يوجد جهات عميل أو استشاري مسجلة' : 'No client or consultant records found'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ Column 3: Subcontractors ═══ */}
            {(activeTab === 'all' || activeTab === 'subcontractors') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs">
                <div className="sticky top-0 z-10 px-3 py-2 border-b border-orange-200 dark:border-orange-900 bg-orange-50/80 dark:bg-orange-950/40 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <HardHat className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-[11px] font-black text-orange-900 dark:text-orange-300">
                      {isAr ? 'مقاولو الباطن والتوريدات' : 'Subcontractors & Vendors'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 tabular-nums">{filteredSubcontractors.length}</span>
                    {canEditStakeholders && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('subcontractors')}
                        className="p-1 rounded-md text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-100/50 dark:bg-orange-900/40 dark:hover:bg-orange-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        title={isAr ? 'إسناد أعمال لمقاول باطن' : 'Add Subcontractor'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className={`overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 ${activeTab === 'all' ? 'max-h-[70vh]' : 'max-h-[80vh]'}`}>
                  {filteredSubcontractors.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-400">
                      {isAr ? 'لا يوجد مقاولو باطن مسند لهم أعمال' : 'No subcontractors assigned'}
                    </div>
                  ) : (
                    filteredSubcontractors.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs transition-colors">
                        <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center text-[8px] font-black shrink-0">
                          {sub.company_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{sub.company_name}</div>
                          <div className="text-[9px] text-slate-400 leading-tight">{sub.specialization || sub.scope_of_work || '—'}</div>
                        </div>
                        {sub.contract_value ? (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 shrink-0 tabular-nums">
                            {isAr ? `${(sub.contract_value / 1000).toFixed(0)} ألف ج.م` : `${(sub.contract_value / 1000).toFixed(0)}K EGP`}
                          </span>
                        ) : null}
                        {canEditStakeholders && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSub(sub)}
                              className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                              title={isAr ? 'تعديل بيانات المقاول' : 'Edit Subcontractor'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMemberToRemove({ id: sub.id, name: sub.company_name, type: 'subcontractor' })}
                              className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              title={isAr ? 'إزالة' : 'Remove'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ═══ Column 4: Site Resources (Hidden in Phase 1 Focused Mode) ═══ */}
            {!isFocusedProjectsMode() && (activeTab === 'all' || activeTab === 'site_resources') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs">
                <div className="sticky top-0 z-10 px-3 py-2 border-b border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300">
                      {isAr ? 'موارد وعمالة الموقع' : 'Site Resources & Operators'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 tabular-nums">{filteredSiteResources.length}</span>
                    {canEditStakeholders && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('site_resources')}
                        className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title={isAr ? 'إضافة مورد موقع جديد' : 'Add Resource'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className={`overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 ${activeTab === 'all' ? 'max-h-[70vh]' : 'max-h-[80vh]'}`}>
                  {filteredSiteResources.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-400">
                      {isAr ? 'لا يوجد موارد أو عمالة تشغيلية بالموقع' : 'No site resources found'}
                    </div>
                  ) : (
                    filteredSiteResources.map((res) => (
                      <div key={res.id} className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs transition-colors">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[8px] font-black shrink-0">
                          {res.resource_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{res.resource_name}</div>
                          <div className="text-[9px] text-slate-400 leading-tight">{res.person_name} · {res.vehicle_equipment_type || '—'}</div>
                        </div>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${res.resource_type === 'driver' ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800' : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'}`}>
                          {res.resource_type === 'driver' ? (isAr ? 'سائق' : 'Driver') : (isAr ? 'فني تشغيل' : 'Operator')}
                        </span>
                        {canEditStakeholders && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditResource(res)}
                              className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              title={isAr ? 'تعديل بيانات المورد' : 'Edit Resource'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMemberToRemove({ id: res.id, name: res.resource_name, type: 'resource' })}
                              className="min-w-[32px] min-h-[32px] p-1.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              title={isAr ? 'إزالة' : 'Remove'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* EMPTY SEARCH STATE */}
          {searchQuery &&
            filteredEmployees.length === 0 &&
            filteredClientStakeholders.length === 0 &&
            filteredClientContacts.length === 0 &&
            filteredSubcontractors.length === 0 &&
            filteredSiteResources.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                لا توجد نتائج مطابقة لمصطلح البحث &quot;{searchQuery}&quot; في أي فئة.
              </div>
            )}
        </div>
      </div>


      {/* Dynamic Edit Modal (Polymorphic) */}
      {isEditModalOpen && canEditStakeholders && (
        <div role="dialog" aria-modal="true" aria-label={isAr ? 'تعديل بيانات العضو' : 'Edit Member'} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 print:hidden" dir="rtl">
          <div className="w-full max-w-lg p-5 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                <div className="text-end">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editMemberType === 'employee' || editMemberType === 'client_stakeholder' ? 'تعديل بيانات عضو الفريق' : ''}
                    {editMemberType === 'client_contact' ? 'تعديل بيانات جهة الاتصال' : ''}
                    {editMemberType === 'subcontractor' ? 'تعديل بيانات مقاول الباطن' : ''}
                    {editMemberType === 'resource' ? 'تعديل بيانات المورد / المعدة' : ''}
                  </h3>
                  <p className="text-[10px] text-slate-400">تعديل البيانات وحفظها مباشرة بقاعدة بيانات المشروع</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 overflow-y-auto pe-1 flex-1">

              {/* ─── Employee / Client Stakeholder Fields ─── */}
              {(editMemberType === 'employee' || editMemberType === 'client_stakeholder') && editingMember && (
                <>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{editingMember.stakeholder?.name_ar}</span>
                    <span className="text-slate-400 me-2">({editingMember.stakeholder?.role || (isAr ? 'غير محدد' : 'Unassigned')})</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'الدور بالمشروع *' : 'Project Role *'}</label>
                    <input
                      type="text"
                      value={editProjectRole}
                      onChange={(e) => setEditProjectRole(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus:ring-0 transition-all"
                      placeholder={isAr ? "مثال: مهندس موقع مدني" : "e.g. Civil Site Engineer"}
                    />
                    <div className="space-y-1 pt-1">
                      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {isAr ? 'اختيار سريع لتخصصات المكتب الفني:' : 'Quick Select Technical Office Disciplines:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {TO_DISCIPLINE_PRESETS.map((preset) => {
                          const isSelected = editProjectRole === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setEditProjectRole(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 select-none active:scale-95 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {isAr ? 'مصفوفة تحديد المسؤوليات (RACI)' : 'RACI Matrix Role'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { val: 'responsible', label: isAr ? 'R — المنفذ المباشر' : 'R — Responsible', color: 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300' },
                        { val: 'accountable', label: isAr ? 'A — المسؤول المعتمد' : 'A — Accountable', color: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300' },
                        { val: 'consulted', label: isAr ? 'C — المستشار الفني' : 'C — Consulted', color: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300' },
                        { val: 'informed', label: isAr ? 'I — للإحاطة والعلم' : 'I — Informed', color: 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-300' },
                      ] as const).map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setEditRaciRole(opt.val as RaciRole)}
                          className={`px-3 py-2 rounded-lg text-[11px] font-bold border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 select-none ${
                            editRaciRole === opt.val
                              ? opt.color + ' ring-2 ring-offset-1 ring-emerald-500 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editMemberType === 'employee' && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'الفئة الهيكلية' : 'Structural Level'}</label>
                      <div className="grid grid-cols-1 gap-1">
                        {([
                          { val: 0, label: isAr ? 'تلقائي (حسب المسمى الوظيفي)' : 'Automatic (by role)', dot: 'bg-slate-400' },
                          { val: 1, label: isAr ? 'المستوى الأول: الإدارة العليا والقطاع' : 'Level 1: Executive Management', dot: 'bg-red-500' },
                          { val: 2, label: isAr ? 'المستوى الثاني: إدارة المشروع المباشرة' : 'Level 2: Project Management', dot: 'bg-emerald-500' },
                          { val: 3, label: isAr ? 'المستوى الثالث: الفريق الفني والهندسي' : 'Level 3: Technical & Engineering', dot: 'bg-sky-500' },
                          { val: 4, label: isAr ? 'المستوى الرابع: التشغيل وعمالة الموقع' : 'Level 4: Site Operations', dot: 'bg-emerald-500' },
                        ]).map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setEditCustomLevel(opt.val)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                              editCustomLevel === opt.val
                                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-300'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${opt.dot} shrink-0`} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Governance Controls: Direct Manager, Start/End Dates, Active Toggle & Termination Reason */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                      {isAr ? 'حوكمة التكليف والتبعية الإدارية' : 'Assignment Governance & Line Management'}
                    </h4>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isAr ? 'المدير المباشر بالمشروع' : 'Direct Project Manager (Reports To)'}
                      </label>
                      <select
                        value={editReportsTo}
                        onChange={(e) => setEditReportsTo(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">{isAr ? '-- بدون مدير مباشر محدد --' : '-- No Direct Manager Assigned --'}</option>
                        {stakeholders
                          .filter(
                            (m) =>
                              m.id !== editingMember.id &&
                              m.stakeholder_id !== editingMember.stakeholder_id
                          )
                          .map((m) => {
                            const optionVal =
                              editReportsTo && editReportsTo === m.id
                                ? m.id
                                : m.stakeholder_id || m.id;
                            return (
                              <option key={m.id} value={optionVal}>
                                {m.stakeholder?.name_ar || 'عضو مشروع'} — ({m.project_role || m.stakeholder?.role || (isAr ? 'فريق المشروع' : 'Project Team')})
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {isAr ? 'تاريخ بداية التكليف' : 'Start Date'}
                        </label>
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {isAr ? 'تاريخ نهاية التكليف' : 'End Date'}
                        </label>
                        <input
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                      />
                      <span>{isAr ? 'التكليف نشط بالمشروع' : 'Active Assignment'}</span>
                    </label>

                    {!editIsActive && (
                      <div className="space-y-1 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          {isAr ? 'سبب إنهاء التكليف أو النقل' : 'Termination / Transfer Reason'}
                        </label>
                        <input
                          type="text"
                          value={editTerminationReason}
                          onChange={(e) => setEditTerminationReason(e.target.value)}
                          placeholder={isAr ? "مثال: نقل لمشروع آخر / انتهاء مهام التخصص..." : "e.g. Transferred to another project..."}
                          className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─── Client Contact Fields ─── */}
              {editMemberType === 'client_contact' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {(['client', 'consultant'] as const).map(pt => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setEditPartyType(pt)}
                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                          editPartyType === pt
                            ? 'bg-amber-50 dark:bg-amber-950 border-amber-400 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {pt === 'client' ? (isAr ? 'ممثل العميل / المالك' : 'Client Representative') : (isAr ? 'استشاري خارجي / خبير' : 'Consultant')}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'اسم جهة الاتصال *' : 'Contact Name *'}</label>
                    <input
                      type="text"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
                      <input
                        type="text"
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'الشركة / الجهة' : 'Company'}</label>
                      <input
                        type="text"
                        value={editCompanyName}
                        onChange={(e) => setEditCompanyName(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsPrimary}
                      onChange={(e) => setEditIsPrimary(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                    />
                    {isAr ? 'جهة اتصال رئيسية معتمدة بالمشروع' : 'Primary Project Contact'}
                  </label>
                </>
              )}

              {/* ─── Subcontractor Fields ─── */}
              {editMemberType === 'subcontractor' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'اسم الشركة *' : 'Company Name *'}</label>
                    <input
                      type="text"
                      value={editSubCompany}
                      onChange={(e) => setEditSubCompany(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'التخصص' : 'Specialization'}</label>
                      <input
                        type="text"
                        value={editSubSpecialization}
                        onChange={(e) => setEditSubSpecialization(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'قيمة التعاقد (ج.م)' : 'Contract Value (EGP)'}</label>
                      <input
                        type="number"
                        value={editSubContractValue}
                        onChange={(e) => setEditSubContractValue(Number(e.target.value))}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'نطاق الأعمال المسند للمقاول' : 'Scope of Work'}</label>
                    {project?.water_structures && project.water_structures.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditSubScope(e.target.value);
                          }
                        }}
                        className="glass-input w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 mb-1 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">{isAr ? '-- اختر من بنود نطاق عمل المشروع --' : '-- Select from project work scopes --'}</option>
                        {project.water_structures.map((st) => {
                          const label = `${st.name || st.type} (${st.type}) - ${st.area_m2 || 0}م² / ${st.volume_m3 || 0}م³`;
                          return <option key={st.id || st.name} value={label}>{label}</option>;
                        })}
                      </select>
                    )}
                    <textarea
                      value={editSubScope}
                      onChange={(e) => setEditSubScope(e.target.value)}
                      rows={2}
                      placeholder={isAr ? "أو اكتب نطاق الأعمال يدوياً..." : "Or enter scope manually..."}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'اسم الممثل' : 'Representative Name'}</label>
                      <input
                        type="text"
                        value={editSubRepName}
                        onChange={(e) => setEditSubRepName(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'هاتف الممثل' : 'Rep Phone'}</label>
                      <input
                        type="tel"
                        value={editSubRepPhone}
                        onChange={(e) => setEditSubRepPhone(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ─── Site Resource Fields ─── */}
              {editMemberType === 'resource' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'اسم المورد / المعدة *' : 'Resource Name *'}</label>
                      <input
                        type="text"
                        value={editResName}
                        onChange={(e) => setEditResName(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'اسم المشغل / السائق' : 'Operator / Driver Name'}</label>
                      <input
                        type="text"
                        value={editResPersonName}
                        onChange={(e) => setEditResPersonName(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'نوع المعدة / المركبة' : 'Equipment / Vehicle Type'}</label>
                      <input
                        type="text"
                        value={editResVehicle}
                        onChange={(e) => setEditResVehicle(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'الهاتف' : 'Phone'}</label>
                      <input
                        type="tel"
                        value={editResPhone}
                        onChange={(e) => setEditResPhone(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">{isAr ? 'ملاحظات' : 'Notes'}</label>
                    <textarea
                      value={editResNotes}
                      onChange={(e) => setEditResNotes(e.target.value)}
                      rows={2}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-400 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{isAr ? 'جاري الحفظ...' : 'Saving...'}</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />{isAr ? 'حفظ التعديلات' : 'Save Changes'}</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Add Modal */}
      {isAddModalOpen && canEditStakeholders && (
        <div role="dialog" aria-modal="true" aria-label={isAr ? 'إضافة وتعيين جديد' : 'Add New Member'} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
          <div className="w-full max-w-xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-5 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                <div className="text-end">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {targetPartyKind === 'employee' && 'تعيين عضو فريق داخلي في المشروع'}
                    {targetPartyKind === 'client_rep' && 'تسجيل جهة اتصال (ممثل المالك / استشاري)'}
                    {targetPartyKind === 'subcontractors' && 'إسناد أعمال لمقاول باطن جديد'}
                    {targetPartyKind === 'site_resources' && 'إضافة موارد أو عمالة تشغيلية للموقع'}
                  </h3>
                  <p className="text-[10px] text-slate-400">تعبئة البيانات لحفظها بقاعدة بيانات المشروع المباشرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Directory vs Manual Source Switcher (Employees, Client/Consultant Reps, Subcontractors) */}
            {targetPartyKind !== 'site_resources' && (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setModalTab('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                    modalTab === 'existing'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {targetPartyKind === 'employee'
                      ? isAr
                        ? `اختيار من دليل الكوادر والموارد البشرية (${availableDirectory.length})`
                        : `Select from HR Directory (${availableDirectory.length})`
                      : isAr
                        ? 'اختيار من دليل أصحاب المصلحة المعتمد'
                        : 'Select from Approved Stakeholders Directory'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('new')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                    modalTab === 'new'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {targetPartyKind === 'employee'
                      ? isAr
                        ? 'تسجيل شخص غير مدرج بدليل الموارد البشرية'
                        : 'Register non-HR personnel'
                      : targetPartyKind === 'client_rep'
                        ? isAr
                          ? 'إدخال يدوي لممثل جديد'
                          : 'Manual Representative Entry'
                        : isAr
                          ? 'إدخال يدوي لبيانات ممثل المقاول'
                          : 'Manual Representative Entry'}
                  </span>
                </button>
              </div>
            )}

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto pe-1 flex-1">
              
              {/* TARGET A: EMPLOYEE FORM */}
              {targetPartyKind === 'employee' && (
                <div className="space-y-4">
                  {modalTab === 'existing' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'ابحث واختر الموظفين *' : 'Search & Select Employees *'}</label>

                      {/* Dropdown trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen((v) => !v)}
                          className="w-full flex items-center justify-between gap-2 pe-3 ps-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-end outline-none focus:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer transition-colors hover:border-emerald-400"
                        >
                          <span className="text-slate-400 truncate">
                            {selectedStakeholderIds.size === 0
                              ? (isAr ? 'اختر موظفاً أو أكثر...' : 'Select one or more employees...')
                              : (isAr ? `${selectedStakeholderIds.size} موظف محدد` : `${selectedStakeholderIds.size} selected`)}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {/* Dropdown panel */}
                        {dropdownOpen && (
                          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                            {/* Search inside dropdown */}
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                                <input
                                  type="text"
                                  value={directorySearch}
                                  onChange={(e) => setDirectorySearch(e.target.value)}
                                  placeholder={isAr ? 'بحث بالاسم أو التخصص...' : 'Search by name or specialization...'}
                                  autoFocus
                                  className="w-full pe-8 ps-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                              </div>
                            </div>
                            {/* List */}
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {availableDirectory.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">{isAr ? 'لا توجد نتائج' : 'No results found'}</div>
                              ) : availableDirectory.map((stk) => {
                                const isSelected = selectedStakeholderIds.has(stk.id);
                                const isAssigned = assignedStakeholderIds.has(stk.id);
                                return (
                                  <div
                                    key={stk.id}
                                    onClick={() => {
                                      if (isAssigned) return;
                                      setSelectedStakeholderIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(stk.id)) next.delete(stk.id);
                                        else next.add(stk.id);
                                        return next;
                                      });
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2 text-xs cursor-pointer transition-colors ${
                                      isAssigned
                                        ? 'opacity-40 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                  >
                                    {/* Checkbox */}
                                    <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                                      isAssigned ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40' : isSelected ? 'border-emerald-700 bg-emerald-700' : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isAssigned
                                        ? <Check className="w-3 h-3 text-emerald-600" />
                                        : isSelected
                                        ? <Check className="w-3 h-3 text-white" />
                                        : null}
                                    </div>
                                    <div className="text-end flex-1 min-w-0">
                                      <div className="font-bold text-slate-900 dark:text-white truncate">{stk.name_ar}</div>
                                      <div className="text-[10px] text-slate-400">{stk.role}</div>
                                    </div>
                                    {isAssigned && <span className="text-[10px] text-emerald-600 font-bold shrink-0">{isAr ? 'معيّن' : 'Assigned'}</span>}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Footer: done button */}
                            <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400">{selectedStakeholderIds.size} {isAr ? 'محدد' : 'selected'}</span>
                              <button
                                type="button"
                                onClick={() => setDropdownOpen(false)}
                                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1.5 py-0.5 active:scale-95"
                              >
                                {isAr ? 'تم ✓' : 'Done ✓'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selected chips */}
                      {selectedStakeholderIds.size > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.from(selectedStakeholderIds).map((id) => {
                            const stk = availableDirectory.find((s) => s.id === id);
                            if (!stk) return null;
                            return (
                              <span key={id} className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {stk.name_ar}
                                <button
                                  type="button"
                                  onClick={() => setSelectedStakeholderIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
                                  className="hover:text-red-500 transition-colors cursor-pointer leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded p-0.5 active:scale-95"
                                >×</button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'الاسم بالكامل *' : 'Full Name *'}</label>
                          <input
                            type="text"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'الجهة / الشركة' : 'Entity / Company'}</label>
                          <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder={isAr ? 'بي زون إنترناشونال' : 'Pzone International'}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'الهاتف' : 'Phone'}</label>
                          <input
                            type="text"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'دور الموظف في هذا المشروع *' : 'Employee Role in Project *'}</label>
                    <input
                      type="text"
                      value={projectRole}
                      onChange={(e) => setProjectRole(e.target.value)}
                      placeholder={isAr ? 'مثال: مدير التنفيذ / مهندس موقع ميكانيكا' : 'e.g. Site Manager / Mechanical Site Engineer'}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      required
                    />
                    <div className="space-y-1 pt-0.5">
                      <span className="block text-[10px] font-bold text-slate-400">{isAr ? 'اختيار سريع لتخصصات المكتب الفني:' : 'Quick Select Technical Office Disciplines:'}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {TO_DISCIPLINE_PRESETS.map((preset) => {
                          const isSelected = projectRole === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProjectRole(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'مصفوفة تحديد المسؤوليات (RACI) *' : 'RACI Matrix Role *'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(RACI_CONFIG) as RaciRole[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRaciRole(key)}
                          className={`p-2.5 text-end rounded-xl border flex flex-col justify-between gap-1 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                            raciRole === key ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">{isAr ? RACI_CONFIG[key].nameAr : RACI_CONFIG[key].nameEn}</span>
                          <span className="text-[9px] text-slate-400">{RACI_CONFIG[key].description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET B: CLIENT/CONSULTANT FORM */}
              {targetPartyKind === 'client_rep' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactPartyType('client');
                        if (!selectedContactPersonId && project) {
                          setSelectedContactEntityId(project.client_id || '');
                          setContactCompanyName(project.client?.name_ar || project.client_name_raw || '');
                        }
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 ${
                        contactPartyType === 'client' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500 text-amber-900 dark:text-amber-200' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isAr ? 'ممثل المالك / العميل' : 'Client Representative'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactPartyType('consultant');
                        if (!selectedContactPersonId && project) {
                          const meta = (project.metadata || {}) as Record<string, any>;
                          setSelectedContactEntityId(meta.consultant_client_id || '');
                          setContactCompanyName(meta.consultant_firm || '');
                        }
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-95 ${
                        contactPartyType === 'consultant' ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 ring-1 ring-sky-500 text-sky-900 dark:text-sky-200' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isAr ? 'استشاري خارجي / خبير' : 'External Consultant / Expert'}
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <StakeholderEntitySelect
                      mode="entity"
                      entities={dedupedEntities}
                      value={selectedContactEntityId}
                      legacyDisplayValue={contactCompanyName}
                      preferredCategories={['owner_developer', 'main_contractor', 'consultant']}
                      quickAddType={contactPartyType === 'consultant' ? 'consultant' : 'client'}
                      disabled={loadingDirectory}
                      label={isAr ? 'الجهة / الشركة المعتمدة بالدليل' : 'Approved Organization / Entity'}
                      placeholder={
                        loadingDirectory
                          ? isAr
                            ? 'جاري تحميل دليل الجهات...'
                            : 'Loading entities directory...'
                          : isAr
                            ? 'اختر الجهة أو الشركة من الدليل...'
                            : 'Select organization from directory...'
                      }
                      onChange={(val) => {
                        const matched = findCanonicalEntity(dedupedEntities, val);
                        if (matched) {
                          setSelectedContactEntityId(matched.id);
                          setContactCompanyName(isAr ? matched.displayNameAr : matched.displayNameEn);
                        } else if (!val) {
                          setSelectedContactEntityId('');
                          setContactCompanyName('');
                        }
                      }}
                      onSelectEntity={(entity) => {
                        if (entity) {
                          setSelectedContactEntityId(entity.id);
                          setContactCompanyName(isAr ? entity.displayNameAr : entity.displayNameEn);
                        } else {
                          setSelectedContactEntityId('');
                          setContactCompanyName('');
                        }
                      }}
                      onEntityCreated={(created) => {
                        handleEntityCreatedInModal(created);
                        setSelectedContactEntityId(created.id);
                        setContactCompanyName(isAr ? created.name_ar : created.name_en || created.name_ar);
                      }}
                    />

                    {modalTab === 'existing' ? (
                      <StakeholderEntitySelect
                        mode="person"
                        people={directoryPeople}
                        clients={clientsList}
                        value={selectedContactPersonId}
                        legacyDisplayValue={newPersonName}
                        preferredKinds={['client_rep', 'external_expert']}
                        defaultQuickAddKind={contactPartyType === 'consultant' ? 'external_expert' : 'client_rep'}
                        preferredClientId={selectedContactEntityId || undefined}
                        preferredOrgName={contactCompanyName || undefined}
                        disabled={loadingDirectory}
                        label={isAr ? 'اختر الممثل / المهندس من الدليل *' : 'Select Representative from Directory *'}
                        placeholder={
                          loadingDirectory
                            ? isAr
                              ? 'جاري تحميل دليل الأفراد...'
                              : 'Loading people directory...'
                            : isAr
                              ? 'ابحث بالاسم أو الهاتف أو المسمى الوظيفي...'
                              : 'Search by name, phone, or job title...'
                        }
                        onChange={(val) => {
                          const matchedPerson = directoryPeople.find((p) => p.id === val);
                          if (matchedPerson) {
                            setSelectedContactPersonId(matchedPerson.id);
                            setNewPersonName(
                              isAr ? matchedPerson.name_ar : matchedPerson.name_en || matchedPerson.name_ar
                            );
                          } else if (!val) {
                            setSelectedContactPersonId('');
                            setNewPersonName('');
                          }
                        }}
                        onSelectPerson={(person) => {
                          if (person) {
                            setSelectedContactPersonId(person.id);
                            setNewPersonName(isAr ? person.name_ar : person.name_en || person.name_ar);
                            setContactJobTitle(person.role || '');
                            setNewPhone(person.phone || '');
                            setNewEmail(person.email || '');
                            if (person.client_id) {
                              const ent = findCanonicalEntity(dedupedEntities, person.client_id);
                              if (ent) {
                                setSelectedContactEntityId(ent.id);
                                setContactCompanyName(isAr ? ent.displayNameAr : ent.displayNameEn);
                              }
                            } else if (!contactCompanyName && person.organization_name) {
                              setContactCompanyName(person.organization_name);
                            }
                          } else {
                            setSelectedContactPersonId('');
                            setNewPersonName('');
                          }
                        }}
                        onPersonCreated={(created) => {
                          handlePersonCreatedInModal(created);
                          setSelectedContactPersonId(created.id);
                          setNewPersonName(isAr ? created.name_ar : created.name_en || created.name_ar);
                          setContactJobTitle(created.role || '');
                          setNewPhone(created.phone || '');
                          setNewEmail(created.email || '');
                          if (created.client_id) {
                            const ent = findCanonicalEntity(dedupedEntities, created.client_id);
                            if (ent) {
                              setSelectedContactEntityId(ent.id);
                              setContactCompanyName(isAr ? ent.displayNameAr : ent.displayNameEn);
                            }
                          } else if (!contactCompanyName && created.organization_name) {
                            setContactCompanyName(created.organization_name);
                          }
                        }}
                      />
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'اسم الممثل بالكامل *' : 'Representative Full Name *'}</label>
                        <input
                          type="text"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'المسمى الوظيفي للممثل' : 'Representative Job Title'}</label>
                      <input
                        type="text"
                        value={contactJobTitle}
                        onChange={(e) => setContactJobTitle(e.target.value)}
                        placeholder={isAr ? 'مثال: مدير مشروع المالك / مهندس مقيم' : 'e.g. Client Project Manager / Resident Engineer'}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'الهاتف' : 'Phone'}</label>
                        <input
                          type="text"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="is_primary_contact"
                        checked={contactIsPrimary}
                        onChange={(e) => setContactIsPrimary(e.target.checked)}
                        className="w-4 h-4 text-emerald-700 dark:text-emerald-300 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      />
                      <label htmlFor="is_primary_contact" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">{isAr ? 'هل هو الممثل الرئيسي للتوجيه وتلقي المراسلات؟' : 'Is this the primary contact for correspondence?'}</label>
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET C: SUBCONTRACTOR FORM */}
              {targetPartyKind === 'subcontractors' && (
                <div className="space-y-4">
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <StakeholderEntitySelect
                      mode="entity"
                      entities={dedupedEntities}
                      value={selectedSubEntityId}
                      legacyDisplayValue={subCompanyName}
                      preferredCategories={['subcontractor_vendor', 'main_contractor']}
                      quickAddType="subcontractor"
                      disabled={loadingDirectory}
                      label={isAr ? 'شركة مقاول الباطن / المورد *' : 'Subcontractor / Vendor Company *'}
                      placeholder={
                        loadingDirectory
                          ? isAr
                            ? 'جاري تحميل دليل الشركات...'
                            : 'Loading companies directory...'
                          : isAr
                            ? 'اختر شركة مقاول الباطن أو المورد من الدليل...'
                            : 'Select subcontractor or vendor from directory...'
                      }
                      onChange={(val) => {
                        const matched = findCanonicalEntity(dedupedEntities, val);
                        if (matched) {
                          setSelectedSubEntityId(matched.id);
                          setSubCompanyName(isAr ? matched.displayNameAr : matched.displayNameEn);
                        } else if (!val) {
                          setSelectedSubEntityId('');
                          setSubCompanyName('');
                        }
                      }}
                      onSelectEntity={(entity) => {
                        if (entity) {
                          setSelectedSubEntityId(entity.id);
                          setSubCompanyName(isAr ? entity.displayNameAr : entity.displayNameEn);
                          if (!subRepName && entity.contact_person) setSubRepName(entity.contact_person);
                          if (!subRepPhone && entity.phone) setSubRepPhone(entity.phone);
                          if (!subRepEmail && entity.email) setSubRepEmail(entity.email);
                        } else {
                          setSelectedSubEntityId('');
                          setSubCompanyName('');
                        }
                      }}
                      onEntityCreated={(created) => {
                        handleEntityCreatedInModal(created);
                        setSelectedSubEntityId(created.id);
                        setSubCompanyName(isAr ? created.name_ar : created.name_en || created.name_ar);
                        if (!subRepName && created.contact_person) setSubRepName(created.contact_person);
                        if (!subRepPhone && created.phone) setSubRepPhone(created.phone);
                        if (!subRepEmail && created.email) setSubRepEmail(created.email);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'التخصص' : 'Specialization'}</label>
                        <input
                          type="text"
                          value={subSpecialization}
                          onChange={(e) => setSubSpecialization(e.target.value)}
                          placeholder={isAr ? 'خرسانة، صحي، إلخ' : 'Concrete, Plumbing, etc.'}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'قيمة العقد الإجمالية (ج.م) *' : 'Total Contract Value (EGP) *'}</label>
                        <input
                          type="number"
                          value={subContractValue}
                          onChange={(e) => setSubContractValue(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-mono text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'نطاق الأعمال المسند للمقاول' : 'Assigned Scope of Work'}</label>
                      {project?.water_structures && project.water_structures.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setSubScopeOfWork(e.target.value);
                            }
                          }}
                          className="w-full p-2 mb-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                        >
                          <option value="">{isAr ? '-- اختر من بنود نطاق عمل المشروع --' : '-- Select from Project Scope Items --'}</option>
                          {project.water_structures.map((st) => {
                            const label = `${st.name || st.type} (${st.type}) - ${st.area_m2 || 0}م² / ${st.volume_m3 || 0}م³`;
                            return <option key={st.id || st.name} value={label}>{label}</option>;
                          })}
                        </select>
                      )}
                      <textarea
                        rows={2}
                        value={subScopeOfWork}
                        onChange={(e) => setSubScopeOfWork(e.target.value)}
                        placeholder={isAr ? 'أو اكتب نطاق الأعمال يدوياً...' : 'Or enter scope of work manually...'}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase">{isAr ? 'بيانات ممثل مقاول الباطن للتواصل' : 'Subcontractor Representative Contact Details'}</h5>
                    {modalTab === 'existing' ? (
                      <StakeholderEntitySelect
                        mode="person"
                        valueMode="name"
                        people={directoryPeople}
                        clients={clientsList}
                        value={subRepName}
                        legacyDisplayValue={subRepName}
                        preferredKinds={['vendor_rep']}
                        defaultQuickAddKind="vendor_rep"
                        preferredClientId={selectedSubEntityId || undefined}
                        preferredOrgName={subCompanyName || undefined}
                        disabled={loadingDirectory}
                        label={isAr ? 'اختر ممثل المقاول / المورد من الدليل' : 'Select Vendor Representative from Directory'}
                        placeholder={
                          loadingDirectory
                            ? isAr
                              ? 'جاري تحميل دليل الممثلين...'
                              : 'Loading representatives...'
                            : isAr
                              ? 'ابحث بالاسم أو الهاتف أو اختر من الدليل...'
                              : 'Search by name or phone...'
                        }
                        onChange={(val) => {
                          if (!val) {
                            setSubRepName('');
                          } else if (!val.startsWith('legacy:')) {
                            setSubRepName(val);
                          }
                        }}
                        onSelectPerson={(person) => {
                          if (person) {
                            setSubRepName(isAr ? person.name_ar : person.name_en || person.name_ar);
                            if (person.phone) setSubRepPhone(person.phone);
                            if (person.email) setSubRepEmail(person.email);
                            if (!selectedSubEntityId && person.client_id) {
                              const ent = findCanonicalEntity(dedupedEntities, person.client_id);
                              if (ent) {
                                setSelectedSubEntityId(ent.id);
                                setSubCompanyName(isAr ? ent.displayNameAr : ent.displayNameEn);
                              }
                            } else if (!subCompanyName && person.organization_name) {
                              setSubCompanyName(person.organization_name);
                            }
                          } else {
                            setSubRepName('');
                          }
                        }}
                        onPersonCreated={(created) => {
                          handlePersonCreatedInModal(created);
                          setSubRepName(isAr ? created.name_ar : created.name_en || created.name_ar);
                          if (created.phone) setSubRepPhone(created.phone);
                          if (created.email) setSubRepEmail(created.email);
                          if (!selectedSubEntityId && created.client_id) {
                            const ent = findCanonicalEntity(dedupedEntities, created.client_id);
                            if (ent) {
                              setSelectedSubEntityId(ent.id);
                              setSubCompanyName(isAr ? ent.displayNameAr : ent.displayNameEn);
                            }
                          } else if (!subCompanyName && created.organization_name) {
                            setSubCompanyName(created.organization_name);
                          }
                        }}
                      />
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'اسم الممثل' : 'Representative Name'}</label>
                        <input
                          type="text"
                          value={subRepName}
                          onChange={(e) => setSubRepName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input
                          type="text"
                          value={subRepPhone}
                          onChange={(e) => setSubRepPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                        <input
                          type="email"
                          value={subRepEmail}
                          onChange={(e) => setSubRepEmail(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET D: SITE RESOURCES FORM */}
              {targetPartyKind === 'site_resources' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResType('driver')}
                      className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                        resType === 'driver' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-200' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isAr ? 'سائق معدة / مركبة' : 'Equipment / Vehicle Driver'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResType('equipment_operator')}
                      className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                        resType === 'equipment_operator' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-200' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isAr ? 'مشغل / فني تشغيل معدة' : 'Equipment Operator / Technician'}
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'مسمى المورد (الوظيفة أو التوصيف) *' : 'Resource Name (Job or Description) *'}</label>
                      <input
                        type="text"
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        placeholder={isAr ? 'مثال: سائق لودر Caterpillar / مشغل خلاطة' : 'e.g. Caterpillar Loader Driver / Mixer Operator'}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'اسم الشخص (السائق/المشغل)' : 'Operator / Driver Name'}</label>
                        <input
                          type="text"
                          value={resOperatorName}
                          onChange={(e) => setResOperatorName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'رقم هاتف التواصل' : 'Contact Phone Number'}</label>
                        <input
                          type="text"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 dir-ltr text-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'موديل ونوع المعدة / المركبة' : 'Equipment / Vehicle Model & Type'}</label>
                      <input
                        type="text"
                        value={resVehicleType}
                        onChange={(e) => setResVehicleType(e.target.value)}
                        placeholder="Caterpillar 950H"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'ملاحظات إضافية (أوقات التواجد والجدولة)' : 'Additional Notes (Availability & Schedule)'}</label>
                      <textarea
                        rows={2}
                        value={resNotes}
                        onChange={(e) => setResNotes(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-purple-600 hover:from-emerald-800 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isAr ? 'حفظ وإسناد للمشروع' : 'Save & Assign to Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {memberToRemove && canEditStakeholders && (
        <div role="dialog" aria-modal="true" aria-label={isAr ? 'تأكيد حذف السجل' : 'Confirm Deletion'} className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-end">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">{isAr ? 'إزالة وتأكيد حذف السجل' : 'Remove & Confirm Deletion'}</h3>
                <p className="text-[10px] text-slate-400">{isAr ? 'يرجى التأكد قبل المتابعة' : 'Please verify before proceeding'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-end">
              {isAr ? (
                <>هل أنت متأكد من رغبتك في إزالة العضو أو مقاول الباطن: <strong className="text-slate-900 dark:text-white font-black">{memberToRemove.name}</strong>؟ سيؤدي ذلك لحذف سجله وتعيينه من جداول المشروع نهائياً.</>
              ) : (
                <>Are you sure you want to remove member / subcontractor: <strong className="text-slate-900 dark:text-white font-black">{memberToRemove.name}</strong>? This will permanently remove their record from this project.</>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={removing}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95"
              >
                {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CLEAN EXECUTIVE REPORT & PDF PREVIEW MODAL ═══ */}
      {isPrintModalOpen && (
        <div role="dialog" aria-modal="true" aria-label={isAr ? 'معاينة التقرير التنفيذي للمشروع' : 'Executive Project Report Preview'} className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header Controls */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-700 text-white">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{isAr ? 'معاينة التقرير التنفيذي للمشروع' : 'Executive Project Report Preview'}</h3>
                  <p className="text-[11px] text-slate-400">{isAr ? 'تقرير رسمي جاهز للطباعة والتصدير المباشر بصيغة PDF' : 'Official report ready for direct printing and PDF export'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCleanReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? '🖨️ طباعة التقرير' : '🖨️ Print Report'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCleanReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isAr ? '📄 تنزيل ملف PDF' : '📄 Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer me-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Slicer: choose sections + enable free editing */}
            <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-2 shrink-0 text-xs">
              <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> {isAr ? 'تخصيص التقرير:' : 'Customize Report:'}
              </span>
              {([
                ['staff', isAr ? 'فريق بي زون' : 'PZone Team'],
                ['client', isAr ? 'العميل والاستشاري' : 'Client & Consultant'],
                ['subs', isAr ? 'مقاولو الباطن' : 'Subcontractors'],
                ['resources', isAr ? 'الكوادر والمعدات' : 'Staff & Equipment'],
                ['lifecycle', isAr ? 'دورة حياة مدير المشروع' : 'PM Life Cycle'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportSections((s) => ({ ...s, [key]: !s[key] }))}
                  className={`px-3 py-1 rounded-full border font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 ${
                    reportSections[key]
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 line-through'
                  }`}
                >
                  {label}
                </button>
              ))}
              {canEditStakeholders && (
                <button
                  type="button"
                  onClick={() => setReportEditable((v) => !v)}
                  className={`ms-auto px-3 py-1 rounded-full border font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 ${
                    reportEditable ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {reportEditable ? (isAr ? '✏️ التحرير مفعّل — اضغط على أي نص لتعديله' : '✏️ Editing enabled — click any text') : (isAr ? '✏️ تفعيل التحرير' : '✏️ Enable Free Edit')}
                </button>
              )}
            </div>

            {/* Printable Paper Content (Standalone Component with ID for Clean Print) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dir-rtl text-end font-sans">
              <div id="executive-printable-paper" contentEditable={reportEditable && canEditStakeholders} suppressContentEditableWarning className={`space-y-6 bg-white text-slate-900 dir-rtl text-end outline-none ${reportEditable && canEditStakeholders ? 'ring-1 ring-dashed ring-emerald-400/60 rounded p-2' : ''}`}>
                {/* Paper Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">PZONE INTERNATIONAL</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold border border-slate-300 dark:border-slate-700">تقرير تنفيذي رسمي</span>
                    </div>
                    <h1 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'جدول فريق العمل والموارد ومقاولي الباطن للمشروع' : 'Project Team, Resources & Subcontractors Schedule'}
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                      {isAr ? 'المشروع:' : 'Project:'} <strong className="text-slate-900 dark:text-slate-100">{project?.project_name_ar || project?.project_name}</strong>
                    </p>
                  </div>

                  <div className="text-start font-mono text-xs text-slate-600 dark:text-slate-400 space-y-0.5 dir-ltr border-r-2 border-slate-200 dark:border-slate-800 pe-4">
                    <div><strong>Code:</strong> #{project?.project_code || project?.id}</div>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
                    <div><strong>Owner:</strong> {project?.client_name_raw || '—'}</div>
                  </div>
                </div>

              {/* Table 1: Pzone Staff */}
              {reportSections.staff && stakeholders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-950 bg-slate-100 dark:bg-slate-800 p-2 rounded border-r-4 border-emerald-800">
                    {isAr ? 'أولاً: هيكل فريق عمل بي زون الداخلي' : '1. PZone Internal Team Structure'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الدور في المشروع' : 'Role in Project'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المسمى الوظيفي بالموارد البشرية' : 'HR Job Title'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'الهاتف' : 'Phone'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'مصفوفة المسؤوليات (RACI)' : 'RACI Role'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(() => {
                        let counter = 0;
                        return (
                          <>
                            {employeeLevels.executive.filter(isActiveMember).map((e) => {
                              counter++;
                              return (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{counter}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{e.stakeholder?.name_ar}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{e.stakeholder?.role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{e.stakeholder?.phone || '-'}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'الإدارة العليا' : 'Executive'})</td>
                                </tr>
                              );
                            })}
                            {employeeLevels.management.filter(isActiveMember).map((e) => {
                              counter++;
                              return (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{counter}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{e.stakeholder?.name_ar}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{e.stakeholder?.role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{e.stakeholder?.phone || '-'}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'إدارة المشروع' : 'Management'})</td>
                                </tr>
                              );
                            })}
                            {employeeLevels.technical.filter(isActiveMember).map((e) => {
                              counter++;
                              return (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{counter}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{e.stakeholder?.name_ar}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{e.stakeholder?.role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{e.stakeholder?.phone || '-'}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'الفريق الفني' : 'Technical'})</td>
                                </tr>
                              );
                            })}
                            {employeeLevels.operations.filter(isActiveMember).map((e) => {
                              counter++;
                              return (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{counter}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{e.stakeholder?.name_ar}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{e.stakeholder?.role}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{e.stakeholder?.phone || '-'}</td>
                                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'التشغيل والعمليات' : 'Operations'})</td>
                                </tr>
                              );
                            })}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table 2: Client & Consultants */}
              {reportSections.client && clientContacts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-950 bg-slate-100 dark:bg-slate-800 p-2 rounded border-r-4 border-amber-600">
                    {isAr ? 'ثانياً: ممثلو العميل واستشاري المشروع' : '2. Client & Consultant Representatives'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الصفة' : 'Role / Party'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الجهة / الشركة' : 'Company / Entity'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'الهاتف' : 'Phone'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {clientContacts.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{c.contact_name}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-700 dark:text-slate-300">{c.party_type === 'client' ? (isAr ? 'ممثلو العميل' : 'Client Representatives') : (isAr ? 'استشاري المشروع' : 'Project Consultant')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2">{c.company_name || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{c.job_title || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{c.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table 3: Subcontractors */}
              {reportSections.subs && subcontractors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-950 bg-slate-100 dark:bg-slate-800 p-2 rounded border-r-4 border-purple-600">
                    {isAr ? 'ثالثاً: مقاولو الباطن المسند لهم أعمال' : '3. Assigned Subcontractors'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الشركة / مقاول الباطن' : 'Subcontractor / Company'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'التخصص' : 'Specialization'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'نطاق الأعمال المسند' : 'Assigned Scope of Work'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'قيمة العقد' : 'Contract Value'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'ممثل المقاول' : 'Subcontractor Rep'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'هاتف الممثل' : 'Rep Phone'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {subcontractors.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{s.company_name}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2">{s.specialization || (isAr ? 'عام' : 'General')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{s.scope_of_work || s.scope_description || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold font-mono text-slate-900 dark:text-slate-100">{formatCurrency(s.contract_value)}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2">{s.rep_name || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{s.rep_phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table 4: Site Resources */}
              {reportSections.resources && siteResources.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-950 bg-slate-100 dark:bg-slate-800 p-2 rounded border-r-4 border-emerald-600">
                    {isAr ? 'رابعاً: الكوادر والعمالة ومعدات الموقع' : '4. Site Personnel & Equipment Resources'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'مسمى المورد / الوظيفة' : 'Resource Name / Job'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الفئة' : 'Category'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'اسم الكادر / المشغل' : 'Operator / Driver Name'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'رقم الهاتف' : 'Phone'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المعدة / المركبة' : 'Equipment / Vehicle'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {siteResources.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60">
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{r.resource_name}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2">{r.resource_type === 'driver' ? (isAr ? 'سائق معدة' : 'Driver') : (isAr ? 'فني تشغيل' : 'Operations Tech')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2">{r.person_name || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono" dir="ltr">{r.phone || '-'}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{r.vehicle_equipment_type || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table 5: PM Life Cycle */}
              {reportSections.lifecycle && pmHistory.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-950 bg-slate-100 dark:bg-slate-800 p-2 rounded border-r-4 border-indigo-600">
                    {isAr ? 'خامساً: السجل التاريخي ودورة حياة مديري المشروع' : '5. Project Manager Life Cycle History'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700">
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'من تاريخ' : 'Start Date'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'إلى تاريخ' : 'End Date'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'سبب التغيير' : 'Reason for Change'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pmHistory.map((h, idx) => (
                        <tr key={h.id}>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-slate-100">{h.name}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{h.start_date || (isAr ? 'بداية المشروع' : 'Project Start')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{h.end_date || (h.is_active ? (isAr ? 'حتى الآن' : 'Present') : '-')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{h.is_active ? (isAr ? 'الحالي' : 'Current') : (isAr ? 'سابق' : 'Former')}</td>
                          <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400">{h.termination_reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paper Footer */}
              <div className="pt-4 border-t border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                <div>PZONE INTERNATIONAL — PROJECT MANAGEMENT PORTAL</div>
                <div>OFFICIAL EXECUTIVE REPORT</div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY EXECUTIVE TABLE PREVIEW VIEW (Only visible during window.print()) */}
      <div className="hidden print:block space-y-8 p-6 dir-rtl text-end text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
        {/* Print Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-300 dark:border-slate-700 pb-4">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">{isAr ? 'تقرير الهيكل التنظيمي والعمالة والمقاولين للمشروع' : 'Project Organization, Workforce & Subcontractors Report'}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">{isAr ? 'مشروع:' : 'Project:'} {project?.project_name_ar || project?.project_name}</p>
          </div>
          <div className="text-start font-mono text-[10px] text-slate-400">
            <div>{isAr ? 'كود المشروع:' : 'Project Code:'} {project?.project_code}</div>
            <div>{isAr ? 'تاريخ الطباعة:' : 'Print Date:'} {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
          </div>
        </div>

        {/* Print Section 1: PZone Internal Team */}
        {stakeholders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-950 border-r-4 border-slate-800 pe-2">{isAr ? 'أولاً: هيكل فريق عمل بي زون الداخلي' : '1. PZone Internal Team Structure'}</h3>
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الاسم' : 'Name'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الدور في المشروع' : 'Role in Project'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المسمى الوظيفي بالموارد البشرية' : 'HR Job Title'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'الهاتف' : 'Phone'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'مصفوفة المسؤوليات (RACI)' : 'RACI'}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let counter = 0;
                  return (
                    <>
                      {employeeLevels.executive.filter(isActiveMember).map((e) => {
                        counter++;
                        return (
                          <tr key={e.id}>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{counter}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{e.stakeholder?.name_ar}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{e.stakeholder?.role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{e.stakeholder?.phone || '-'}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'الإدارة العليا' : 'Executive'})</td>
                          </tr>
                        );
                      })}
                      {employeeLevels.management.filter(isActiveMember).map((e) => {
                        counter++;
                        return (
                          <tr key={e.id}>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{counter}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{e.stakeholder?.name_ar}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{e.stakeholder?.role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{e.stakeholder?.phone || '-'}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'إدارة المشروع' : 'Management'})</td>
                          </tr>
                        );
                      })}
                      {employeeLevels.technical.filter(isActiveMember).map((e) => {
                        counter++;
                        return (
                          <tr key={e.id}>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{counter}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{e.stakeholder?.name_ar}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{e.stakeholder?.role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{e.stakeholder?.phone || '-'}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'الفريق الفني' : 'Technical'})</td>
                          </tr>
                        );
                      })}
                      {employeeLevels.operations.filter(isActiveMember).map((e) => {
                        counter++;
                        return (
                          <tr key={e.id}>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{counter}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{e.stakeholder?.name_ar}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2">{e.project_role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{e.stakeholder?.role}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{e.stakeholder?.phone || '-'}</td>
                            <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{RACI_CONFIG[e.raci_role]?.nameAr} ({isAr ? 'التشغيل والعمليات' : 'Operations'})</td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Section 2: Client & Consultants */}
        {clientContacts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-950 border-r-4 border-slate-800 pe-2">{isAr ? 'ثانياً: ممثلو العميل واستشاري المشروع' : '2. Client & Consultant Representatives'}</h3>
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الاسم' : 'Name'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الصفة' : 'Role / Party'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الجهة / الشركة' : 'Company / Entity'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'الهاتف' : 'Phone'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                </tr>
              </thead>
              <tbody>
                {clientContacts.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{c.contact_name}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-slate-700 dark:text-slate-300">{c.party_type === 'client' ? (isAr ? 'ممثلو العميل' : 'Client Representatives') : (isAr ? 'استشاري المشروع' : 'Project Consultant')}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2">{c.company_name || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{c.job_title || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{c.phone || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{c.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Section 3: Subcontractors */}
        {subcontractors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-950 border-r-4 border-slate-800 pe-2">{isAr ? 'ثالثاً: مقاولو الباطن المسند لهم أعمال' : '3. Assigned Subcontractors'}</h3>
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'الشركة / مقاول الباطن' : 'Subcontractor / Company'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'التخصص' : 'Specialization'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'نطاق الأعمال والمسؤولية' : 'Scope of Work & Responsibility'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'قيمة العقد الإجمالية' : 'Total Contract Value'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'اسم ممثل المقاول' : 'Subcontractor Rep Name'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'هاتف الممثل' : 'Rep Phone'}</th>
                </tr>
              </thead>
              <tbody>
                {subcontractors.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{s.company_name}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2">{s.specialization || (isAr ? 'عام' : 'General')}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{s.scope_of_work || s.scope_description || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold font-mono text-emerald-800 dark:text-emerald-300">{formatCurrency(s.contract_value)}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2">{s.rep_name || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{s.rep_phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Section 4: Site Resources */}
        {siteResources.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-950 border-r-4 border-slate-800 pe-2">{isAr ? 'رابعاً: الكوادر والعمالة ومعدات التشغيل بالموقع' : '4. Site Personnel & Equipment Resources'}</h3>
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-10">{isAr ? 'م' : 'No.'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold w-1/4">{isAr ? 'مسمى المورد / الوظيفة' : 'Resource Name / Job'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'الفئة' : 'Category'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'اسم الكادر / المشغل' : 'Operator / Driver Name'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold font-mono">{isAr ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'المعدة / نوع المركبة' : 'Equipment / Vehicle Type'}</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-2 text-end font-bold">{isAr ? 'ملاحظات' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {siteResources.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold">{r.resource_name}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2">{r.resource_type === 'driver' ? (isAr ? 'سائق معدة' : 'Driver') : (isAr ? 'فني تشغيل' : 'Operations Tech')}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2">{r.person_name || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 font-mono">{r.phone || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400">{r.vehicle_equipment_type || '-'}</td>
                    <td className="border border-slate-300 dark:border-slate-700 p-2 text-slate-400">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

TeamTab.displayName = 'TeamTab';
