'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Send, 
  Search, 
  Plus, 
  GitBranch, 
  ExternalLink, 
  Layers, 
  FileCheck2, 
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  UploadCloud,
  ShieldCheck,
  AlertCircle,
  FolderTree,
  CheckCheck,
  Inbox,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentControlService } from '@/lib/services/documentControl.service';
import { ProjectService } from '@/lib/services/project.service';
import type { ControlledDocument, DocumentTransmittal, DocType, DocStatus } from '@/types/document-control';
import { UnauthorizedView } from '@/components/shared/UnauthorizedView';
import { AddDocumentModal } from '@/components/document-control/AddDocumentModal';
import { NewTransmittalModal } from '@/components/document-control/NewTransmittalModal';
import { NewRevisionModal } from '@/components/document-control/NewRevisionModal';

const ALLOWED_ROLES = ['admin', 'technical_office_engineer', 'project_manager', 'doc_controller', 'coo'];

function safeHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// Folder category definitions for EDMS tree structure
interface FolderNode {
  id: string;
  labelAr: string;
  labelEn: string;
  type?: DocType;
  discipline?: string;
  icon?: React.ReactNode;
  children?: FolderNode[];
}

const EDMS_FOLDER_STRUCTURE: FolderNode[] = [
  {
    id: 'folder-drawings',
    labelAr: '01 - المخططات والرسومات الهندسية',
    labelEn: '01 - Engineering Drawings',
    type: 'drawing',
    children: [
      { id: 'drawing-arch', labelAr: 'المخططات المعمارية', labelEn: 'Architectural Drawings', type: 'drawing', discipline: 'architectural' },
      { id: 'drawing-struct', labelAr: 'المخططات الإنشائية', labelEn: 'Structural Drawings', type: 'drawing', discipline: 'structural' },
      { id: 'drawing-mep', labelAr: 'مخططات الأعمال الكهروميكانيكية', labelEn: 'MEP & HVAC Drawings', type: 'drawing', discipline: 'mep' },
      { id: 'drawing-civil', labelAr: 'مخططات الأعمال المدنية', labelEn: 'Civil & Site Works', type: 'drawing', discipline: 'civil' },
      { id: 'drawing-infra', labelAr: 'مخططات أعمال البنية التحتية', labelEn: 'Infrastructure Drawings', type: 'drawing', discipline: 'infrastructure' },
    ],
  },
  {
    id: 'folder-specs',
    labelAr: '02 - المواصفات والمعايير الفنية',
    labelEn: '02 - Specifications & Standards',
    type: 'specification',
  },
  {
    id: 'folder-submittals',
    labelAr: '03 - اعتمادات المواد والعينات',
    labelEn: '03 - Material & Shop Submittals',
    type: 'submittal',
  },
  {
    id: 'folder-contracts',
    labelAr: '04 - العقود والاتفاقيات التعاقدية',
    labelEn: '04 - Contracts & Commercial',
    type: 'contract',
  },
  {
    id: 'folder-reports',
    labelAr: '05 - التقارير الهندسية والفنية',
    labelEn: '05 - Technical & Progress Reports',
    type: 'report',
  },
  {
    id: 'folder-certs',
    labelAr: '06 - شهادات الجودة واختبارات الاعتماد',
    labelEn: '06 - Inspection Certificates',
    type: 'certificate',
  },
  {
    id: 'folder-correspondence',
    labelAr: '07 - المراسلات والخطابات الرسمية',
    labelEn: '07 - Formal Correspondence',
    type: 'correspondence',
  },
];

export default function DocumentControlPage() {
  const { t, locale } = useLanguage();
  const { roles: userRoles, isAdmin, hasAnyRole, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canAccess =
    canAccessPath('/document-control', userRoles || [], isAdmin, dbAccessRules) ||
    hasAnyRole(ALLOWED_ROLES);
  const canEdit =
    !rolesLoading &&
    !accessLoading &&
    !isViewerOnly &&
    canEditPath('/document-control', userRoles || [], isAdmin, dbAccessRules);
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const projectStore = useProjectStore() as any;
  const storeProjects: Array<{ id: string; name?: string; name_ar?: string; name_en?: string; code?: string; title?: string }> =
    projectStore?.projects || projectStore?.allProjects || [];
  const activeProjectData = projectStore?.activeProject;

  const { data: fetchedProjects = [] } = useQuery({
    queryKey: ['edms-projects-list'],
    queryFn: async () => {
      try {
        return (await ProjectService.getProjects()) || [];
      } catch {
        return [];
      }
    },
    enabled: storeProjects.length === 0,
    staleTime: 60000,
  });

  const projectsList: Array<{ id: string; name?: string; name_ar?: string; name_en?: string; code?: string; title?: string }> =
    storeProjects.length > 0 ? storeProjects : fetchedProjects;

  // Local selectedProjectId state synced two-way with useProjectStore
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');

  // 1. Sync from useProjectStore (e.g. TopNav selector) to local selectedProjectId
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // 2. Local project change handler updating both local state and useProjectStore
  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    if (newProjectId && newProjectId !== activeProjectId) {
      setActiveProjectId(newProjectId);
    }
  };

  // Ensure two-way sync if selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId, activeProjectId, setActiveProjectId]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeProjectId && !selectedProjectId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('pzone_active_project');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const storedId = parsed?.state?.activeProjectId;
          if (storedId) {
            setActiveProjectId(storedId);
            setSelectedProjectId(storedId);
            return;
          }
        } catch {}
      }
      const legacyId = localStorage.getItem('pzone_active_project_id');
      if (legacyId) {
        setActiveProjectId(legacyId);
        setSelectedProjectId(legacyId);
      }
    }
  }, [activeProjectId, selectedProjectId, setActiveProjectId]);

  const currentProjectId = selectedProjectId || activeProjectId || '';

  const [activeTab, setActiveTab] = useState<'docs' | 'transmittals' | 'revisions'>('docs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<DocType | ''>('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [isFolderTreeOpen, setIsFolderTreeOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-drawings': true,
  });

  // Transmittal filters
  const [transmittalStatusFilter, setTransmittalStatusFilter] = useState<string>('');
  const [transmittalPurposeFilter, setTransmittalPurposeFilter] = useState<string>('');

  // Modals state
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isNewTransmittalOpen, setIsNewTransmittalOpen] = useState(false);
  const [isNewRevisionOpen, setIsNewRevisionOpen] = useState(false);
  const [selectedDocForRevision, setSelectedDocForRevision] = useState<ControlledDocument | null>(null);

  // Preview & detail modals
  const [previewDoc, setPreviewDoc] = useState<ControlledDocument | null>(null);
  const [viewTransmittal, setViewTransmittal] = useState<DocumentTransmittal | null>(null);

  const isRtl = locale === 'ar';

  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useQuery({
    queryKey: ['document-stats', currentProjectId],
    queryFn: () => documentControlService.getDocumentStats(currentProjectId),
    enabled: !!currentProjectId,
  });

  const { 
    data: documents = [], 
    isLoading: docsLoading, 
    isFetching: docsFetching, 
    refetch: refetchDocs 
  } = useQuery({
    queryKey: ['documents', currentProjectId, typeFilter, statusFilter],
    queryFn: () =>
      documentControlService.getDocuments(currentProjectId, {
        type: typeFilter ? (typeFilter as DocType) : undefined,
        status: statusFilter ? (statusFilter as DocStatus) : undefined,
      }),
    enabled: !!currentProjectId,
  });

  const { 
    data: transmittals = [], 
    isLoading: transmittalsLoading, 
    isFetching: transmittalsFetching,
    refetch: refetchTransmittals 
  } = useQuery({
    queryKey: ['transmittals', currentProjectId],
    queryFn: () => documentControlService.getTransmittals(currentProjectId),
    enabled: !!currentProjectId,
  });

  const isRefreshing = statsFetching || docsFetching || transmittalsFetching;

  const handleRefreshAll = async () => {
    if (!currentProjectId) return;
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents', currentProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['transmittals', currentProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['document-stats', currentProjectId] }),
      ]);
      toast.success(isRtl ? 'تم تحديث بيانات سجل الوثائق والمخططات بنجاح' : 'Document control register refreshed successfully');
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء التحديث' : 'Failed to refresh register');
    }
  };

  // Folder selection logic
  const handleSelectFolder = (node: FolderNode | null) => {
    if (!node || node.id === 'all') {
      setSelectedFolderId('all');
      setTypeFilter('');
      setDisciplineFilter('');
      return;
    }

    setSelectedFolderId(node.id);
    if (node.type) {
      setTypeFilter(node.type);
    } else {
      setTypeFilter('');
    }

    if (node.discipline) {
      setDisciplineFilter(node.discipline);
    } else {
      setDisciplineFilter('');
    }
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return (documents || []).filter((doc) => {
      const matchSearch =
        !searchTerm ||
        doc.title_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.revision?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDiscipline =
        !disciplineFilter || doc.discipline?.toLowerCase() === disciplineFilter.toLowerCase();

      return matchSearch && matchDiscipline;
    });
  }, [documents, searchTerm, disciplineFilter]);

  // Document counts per folder node
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: documents.length,
    };

    EDMS_FOLDER_STRUCTURE.forEach((folder) => {
      if (folder.type) {
        counts[folder.id] = documents.filter((d) => d.type === folder.type).length;
      }
      folder.children?.forEach((child) => {
        counts[child.id] = documents.filter(
          (d) => d.type === child.type && d.discipline === child.discipline
        ).length;
      });
    });

    return counts;
  }, [documents]);

  // Filtered transmittals
  const filteredTransmittals = useMemo(() => {
    return (transmittals || []).filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.transmittal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        !transmittalStatusFilter ||
        t.status?.toUpperCase() === transmittalStatusFilter.toUpperCase();

      const matchPurpose =
        !transmittalPurposeFilter ||
        t.purpose?.toLowerCase() === transmittalPurposeFilter.toLowerCase();

      return matchSearch && matchStatus && matchPurpose;
    });
  }, [transmittals, searchTerm, transmittalStatusFilter, transmittalPurposeFilter]);

  // Documents sorted for revisions register
  const revisionDocs = useMemo(() => {
    return [...(documents || [])].sort((a, b) => {
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }, [documents]);

  const handleDocumentCreated = () => {
    if (!canEdit) return;
    queryClient.invalidateQueries({ queryKey: ['documents', currentProjectId] });
    queryClient.invalidateQueries({ queryKey: ['document-stats', currentProjectId] });
  };

  const handleTransmittalCreated = () => {
    if (!canEdit) return;
    queryClient.invalidateQueries({ queryKey: ['transmittals', currentProjectId] });
    queryClient.invalidateQueries({ queryKey: ['document-stats', currentProjectId] });
  };

  const openRevisionForDoc = (doc: ControlledDocument) => {
    if (!canEdit) return;
    setSelectedDocForRevision(doc);
    setIsNewRevisionOpen(true);
  };

  if (rolesLoading || accessLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label={isRtl ? 'جاري تحميل الصلاحيات...' : 'Loading permissions...'}>
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (!canAccess) {
    return <UnauthorizedView />;
  }

  if (!currentProjectId) {
    return (
      <div className="flex h-[70vh] items-center justify-center p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl inline-flex mb-4">
            <FolderTree className="h-12 w-12 text-blue-600 dark:text-blue-400 opacity-80" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {isRtl ? 'سجل إدارة الوثائق والمخططات الهندسية' : 'Engineering Document Register (EDMS)'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isRtl
              ? 'يرجى اختيار المشروع لعرض وإدارة المخططات وخطابات الإرسال الرسمية'
              : t('common.selectProject')}
          </p>
          {projectsList && projectsList.length > 0 && (
            <div className="space-y-2 text-start">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                {isRtl ? 'اختر المشروع:' : 'Select Project:'}
              </label>
              <select
                value=""
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="" disabled>{isRtl ? 'اختر مشروعاً للبدء...' : 'Choose a project to start...'}</option>
                {projectsList.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {isRtl
                      ? p.project_name_ar || p.project_name || p.public_name || p.name_ar || p.name || p.project_code || p.code || p.id.slice(0, 8)
                      : p.project_name_en || p.project_name || p.public_name || p.name_en || p.name || p.project_code || p.code || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`text-2xl font-bold text-gray-900 dark:text-white ${isRtl ? 'tracking-normal' : 'tracking-tight'}`}>
              {isRtl ? 'سجل إدارة الوثائق والمخططات الهندسية' : 'Electronic Document Management (EDMS)'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isRtl ? 'سجل معتمد ومراقب' : 'Controlled'}</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>{isRtl ? 'المخططات التنفيذية، خطابات الإرسال الرسمية، وسجل تتبع المراجعات' : 'Engineering drawings, transmittals, specifications & revision tracking'}</span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 px-2.5 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
              <Folder className="w-3 h-3 text-blue-500 shrink-0" />
              <span dir="auto">
                {(() => {
                  const p: any = projectsList.find((item) => item.id === currentProjectId) || activeProjectData;
                  if (p) {
                    const name = isRtl
                      ? p.project_name_ar || p.project_name || p.public_name || p.name_ar || p.name || p.title
                      : p.project_name_en || p.project_name || p.public_name || p.name_en || p.name || p.title;
                    const code = p.project_code || p.code;
                    if (code && name) return `${code} — ${name}`;
                    if (name) return name;
                    if (code) return code;
                  }
                  return currentProjectId.slice(0, 8);
                })()}
              </span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Project Switcher in Header if projects exist */}
          {projectsList && projectsList.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <label htmlFor="header-project-select" className="sr-only">
                {isRtl ? 'اختيار المشروع' : 'Select Project'}
              </label>
              <select
                id="header-project-select"
                value={currentProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
              >
                {projectsList.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {isRtl
                      ? p.project_name_ar || p.project_name || p.public_name || p.name_ar || p.name || p.project_code || p.code || p.id.slice(0, 8)
                      : p.project_name_en || p.project_name || p.public_name || p.name_en || p.name || p.project_code || p.code || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            aria-label={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
            title={isRtl ? 'تحديث السجل' : 'Refresh register'}
            className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Action Modals Triggers */}
          {canEdit && (
            activeTab === 'transmittals' ? (
              <button
                type="button"
                onClick={() => setIsNewTransmittalOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isNewTransmittalOpen}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <Send className="h-4 w-4" />
                <span>{isRtl ? 'إصدار خطاب إرسال جديد' : 'New Transmittal'}</span>
              </button>
            ) : activeTab === 'revisions' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedDocForRevision(documents[0] || null);
                  setIsNewRevisionOpen(true);
                }}
                aria-haspopup="dialog"
                aria-expanded={isNewRevisionOpen}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <GitBranch className="h-4 w-4" />
                <span>{isRtl ? 'تسجيل مراجعة جديدة' : 'New Revision'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddDocOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isAddDocOpen}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <Plus className="h-4 w-4" />
                <span>{isRtl ? 'إضافة وثيقة أو مخطط' : 'Add Document'}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={isRtl ? 'إجمالي الوثائق والمخططات' : 'Total Documents'}
              value={stats?.totalDocuments || 0}
              icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              subtitle={isRtl ? 'في سجل المشروع الحالي' : 'Active in this project'}
            />
            <StatCard
              title={isRtl ? 'نسبة الاعتماد النهائي' : 'Approved Ratio'}
              value={`${stats?.totalDocuments ? Math.round(((stats.approvedCount || 0) / stats.totalDocuments) * 100) : 0}%`}
              subtitle={`${stats?.approvedCount || 0} ${isRtl ? 'وثيقة معتمدة ومصادق عليها' : 'approved docs'}`}
              icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <StatCard
              title={isRtl ? 'قيد المراجعة والتدقيق' : 'Under Review'}
              value={stats?.underReviewCount || 0}
              subtitle={isRtl ? 'بانتظار رد وملاحظات الاستشاري' : 'Awaiting review comments'}
              icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            />
            <StatCard
              title={isRtl ? 'خطابات الإرسال الرسمية' : 'Transmittals'}
              value={stats?.totalTransmittals || 0}
              subtitle={isRtl ? 'خطاب مسجل ومعتمد' : 'Recorded transmittals'}
              icon={<Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            />
          </>
        )}
      </div>

      {/* Main Container with Folder Tree Sidebar & Register Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-4 bg-gray-50/60 dark:bg-gray-800/80">
          <nav className="flex overflow-x-auto gap-1" aria-label="EDMS Tabs" role="tablist">
            <TabButton
              active={activeTab === 'docs'}
              onClick={() => setActiveTab('docs')}
              label={isRtl ? 'سجل الوثائق والمخططات' : 'Documents & Drawings Register'}
              icon={<Layers className="w-4 h-4" />}
              count={documents.length}
            />
            <TabButton
              active={activeTab === 'transmittals'}
              onClick={() => setActiveTab('transmittals')}
              label={isRtl ? 'خطابات الإرسال الرسمية' : 'Transmittal Tracking'}
              icon={<Send className="w-4 h-4" />}
              count={transmittals.length}
            />
            <TabButton
              active={activeTab === 'revisions'}
              onClick={() => setActiveTab('revisions')}
              label={isRtl ? 'سجل تتبع المراجعات' : 'Revision History'}
              icon={<GitBranch className="w-4 h-4" />}
              count={revisionDocs.length}
            />
          </nav>

          {/* Quick Toggle for Folder Tree Navigation in Docs Tab */}
          {activeTab === 'docs' && (
            <div className="py-2 flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsFolderTreeOpen(!isFolderTreeOpen)}
                aria-pressed={isFolderTreeOpen}
                aria-label={isRtl ? 'تبديل شجرة المجلدات' : 'Toggle Folder Tree'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isFolderTreeOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>{isRtl ? (isFolderTreeOpen ? 'إخفاء شجرة المجلدات' : 'عرض شجرة المجلدات') : (isFolderTreeOpen ? 'Hide Folder Tree' : 'Show Folder Tree')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Filter & Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`}
            />
            <input
              type="text"
              aria-label={isRtl ? 'البحث في السجل' : 'Search register'}
              placeholder={
                activeTab === 'transmittals'
                  ? isRtl
                    ? 'بحث برقم الخطاب، المرسل، المستلم أو الغرض...'
                    : 'Search transmittal number, sender, recipient...'
                  : isRtl
                  ? 'بحث برقم الوثيقة، اسم المخطط، أو كود المراجعة...'
                  : 'Search document number, drawing title, revision...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
                className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-gray-200 p-0.5`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Docs Tab Specific Filters */}
          {activeTab === 'docs' && (
            <div className="flex flex-wrap gap-2 items-center">
              <select
                aria-label={isRtl ? 'تصفية حسب نوع الوثيقة' : 'Filter by document type'}
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as typeof typeFilter);
                  setSelectedFolderId('custom');
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRtl ? 'جميع أنواع الوثائق' : 'All Doc Types'}</option>
                <option value="drawing">{isRtl ? 'مخطط هندسي' : 'Drawing'}</option>
                <option value="specification">{isRtl ? 'مواصفات فنية' : 'Specification'}</option>
                <option value="submittal">{isRtl ? 'اعتماد مواد وعينات' : 'Submittal'}</option>
                <option value="contract">{isRtl ? 'عقد أو ملحق تعاقدي' : 'Contract'}</option>
                <option value="report">{isRtl ? 'تقرير فني' : 'Report'}</option>
                <option value="certificate">{isRtl ? 'شهادة جودة واعتماد' : 'Certificate'}</option>
                <option value="correspondence">{isRtl ? 'مراسلات رسمية' : 'Correspondence'}</option>
              </select>

              <select
                aria-label={isRtl ? 'تصفية حسب الحالة' : 'Filter by status'}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="approved">{isRtl ? 'معتمد ومصادق عليه' : 'Approved'}</option>
                <option value="under_review">{isRtl ? 'قيد المراجعة والتدقيق' : 'Under Review'}</option>
                <option value="draft">{isRtl ? 'مسودة أولية' : 'Draft'}</option>
                <option value="superseded">{isRtl ? 'مستبدل بمراجعة أحدث' : 'Superseded'}</option>
                <option value="archived">{isRtl ? 'مؤرشف' : 'Archived'}</option>
              </select>

              <select
                aria-label={isRtl ? 'تصفية حسب التخصص الهندسي' : 'Filter by discipline'}
                value={disciplineFilter}
                onChange={(e) => {
                  setDisciplineFilter(e.target.value);
                  setSelectedFolderId('custom');
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRtl ? 'جميع التخصصات' : 'All Disciplines'}</option>
                <option value="architectural">{isRtl ? 'أعمال معمارية' : 'Architectural'}</option>
                <option value="structural">{isRtl ? 'أعمال إنشائية' : 'Structural'}</option>
                <option value="mep">{isRtl ? 'أعمال كهروميكانيكية' : 'MEP'}</option>
                <option value="civil">{isRtl ? 'أعمال مدنية' : 'Civil'}</option>
                <option value="infrastructure">{isRtl ? 'أعمال بنية تحتية' : 'Infrastructure'}</option>
              </select>

              {(typeFilter || statusFilter || disciplineFilter || selectedFolderId !== 'all') && (
                <button
                  type="button"
                  onClick={() => handleSelectFolder(null)}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/40 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium"
                >
                  {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
              )}
            </div>
          )}

          {/* Transmittals Tab Specific Filters */}
          {activeTab === 'transmittals' && (
            <div className="flex flex-wrap gap-2 items-center">
              <select
                aria-label={isRtl ? 'تصفية حسب حالة الخطاب' : 'Filter by transmittal status'}
                value={transmittalStatusFilter}
                onChange={(e) => setTransmittalStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="SENT">{isRtl ? 'تم الإرسال' : 'Sent'}</option>
                <option value="RECEIVED">{isRtl ? 'تم الاستلام' : 'Received'}</option>
                <option value="ACKNOWLEDGED">{isRtl ? 'تم تأكيد الاستلام والرد' : 'Acknowledged'}</option>
                <option value="CLOSED">{isRtl ? 'مغلق ومكتمل' : 'Closed'}</option>
              </select>

              <select
                aria-label={isRtl ? 'تصفية حسب الغرض' : 'Filter by purpose'}
                value={transmittalPurposeFilter}
                onChange={(e) => setTransmittalPurposeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{isRtl ? 'جميع الأغراض' : 'All Purposes'}</option>
                <option value="for_approval">{isRtl ? 'للاعتماد والمصادقة' : 'For Approval'}</option>
                <option value="for_review">{isRtl ? 'للمراجعة وإبداء الملاحظات' : 'For Review'}</option>
                <option value="for_construction">{isRtl ? 'صالح للتنفيذ بالموقع' : 'For Construction (IFC)'}</option>
                <option value="for_information">{isRtl ? 'للعلم والإحاطة' : 'For Information'}</option>
                <option value="as_built">{isRtl ? 'مطابق للمنفذ على الطبيعة' : 'As-Built'}</option>
              </select>

              {(transmittalStatusFilter || transmittalPurposeFilter || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setTransmittalStatusFilter('');
                    setTransmittalPurposeFilter('');
                    setSearchTerm('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/40 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  {isRtl ? 'إعادة ضبط' : 'Reset'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        {activeTab === 'docs' && (
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Collapsible EDMS Folder Tree Sidebar */}
            {isFolderTreeOpen && (
              <aside 
                className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3 sm:p-4 flex-shrink-0"
                aria-label={isRtl ? 'شجرة مجلدات نظام إدارة الوثائق' : 'EDMS Folder Navigation Tree'}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className={`text-xs font-bold text-gray-700 dark:text-gray-300 ${isRtl ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                      {isRtl ? 'دليل مجلدات المشروع' : 'EDMS Directory'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    {documents.length} {isRtl ? 'ملف' : 'files'}
                  </span>
                </div>

                <div className="space-y-1">
                  {/* Root "All Documents" node */}
                  <button
                    type="button"
                    onClick={() => handleSelectFolder(null)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-start ${
                      selectedFolderId === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-slate-700/60 dark:bg-slate-700/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderOpen className={`w-4 h-4 ${selectedFolderId === 'all' ? 'text-white' : 'text-blue-500'}`} />
                      <span className="truncate">{isRtl ? 'جميع الوثائق والمخططات' : 'All Documents & Drawings'}</span>
                    </div>
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                      selectedFolderId === 'all' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {folderCounts.all || 0}
                    </span>
                  </button>

                  {/* Hierarchical Folder Nodes */}
                  {EDMS_FOLDER_STRUCTURE.map((node) => {
                    const isExpanded = !!expandedFolders[node.id];
                    const isSelected = selectedFolderId === node.id;
                    const hasChildren = node.children && node.children.length > 0;
                    const count = folderCounts[node.id] || 0;

                    return (
                      <div key={node.id} className="space-y-0.5">
                        <div
                          className={`flex items-center justify-between rounded-lg transition-colors group ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-slate-700/60 dark:bg-slate-700/60 dark:hover:bg-gray-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectFolder(node)}
                            className="flex-1 flex items-center gap-2 px-2.5 py-1.5 text-xs text-start truncate"
                          >
                            {isSelected ? (
                              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            <span className="truncate">{isRtl ? node.labelAr : node.labelEn}</span>
                          </button>

                          <div className="flex items-center gap-1 pr-1.5 pl-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-200/70 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                              {count}
                            </span>
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolderExpand(node.id);
                                }}
                                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                                className="p-1 hover:bg-gray-300/60 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:text-slate-400"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subfolders */}
                        {hasChildren && isExpanded && (
                          <div className={`space-y-0.5 ${isRtl ? 'pr-4 border-r-2 border-gray-200 dark:border-gray-700 mr-2' : 'pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2'}`}>
                            {node.children!.map((child) => {
                              const isChildSelected = selectedFolderId === child.id;
                              const childCount = folderCounts[child.id] || 0;

                              return (
                                <button
                                  key={child.id}
                                  type="button"
                                  onClick={() => handleSelectFolder(child)}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs text-start transition-colors ${
                                    isChildSelected
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-slate-700/50 dark:bg-slate-700/50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-gray-400">&bull;</span>
                                    <span className="truncate">{isRtl ? child.labelAr : child.labelEn}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {childCount}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* Document Register Table */}
            <main className="flex-1 p-0 overflow-hidden flex flex-col">
              {/* Active Folder Breadcrumb Bar */}
              {selectedFolderId !== 'all' && (
                <div className="px-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">{isRtl ? 'المجلد النشط:' : 'Active Folder:'}</span>
                    <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-medium">
                      {selectedFolderId === 'custom'
                        ? isRtl ? 'تصفية مخصصة' : 'Custom Filters'
                        : isRtl
                        ? EDMS_FOLDER_STRUCTURE.flatMap((f) => [f, ...(f.children || [])]).find((x) => x.id === selectedFolderId)?.labelAr || selectedFolderId
                        : EDMS_FOLDER_STRUCTURE.flatMap((f) => [f, ...(f.children || [])]).find((x) => x.id === selectedFolderId)?.labelEn || selectedFolderId}
                    </span>
                    <span className="text-gray-400 font-mono">({filteredDocs.length} {isRtl ? 'وثيقة' : 'documents'})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectFolder(null)}
                    aria-label={isRtl ? 'إلغاء التصفية بالمجلد' : 'Clear folder filter'}
                    className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 dark:text-blue-300 text-[11px] font-medium"
                  >
                    <X className="w-3 h-3" />
                    <span>{isRtl ? 'عرض كل السجل' : 'Show All'}</span>
                  </button>
                </div>
              )}

              {docsLoading ? (
                <TableSkeleton isRtl={isRtl} />
              ) : filteredDocs.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-slate-400 my-auto">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20 text-blue-600" />
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {isRtl ? 'لا توجد وثائق مطابقة لمعايير البحث' : 'No matching documents found'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {isRtl
                      ? 'يمكنك تغيير المجلد المحدد، مسح كلمات البحث، أو إضافة وثيقة هندسية جديدة للسجل.'
                      : 'Try clearing the search term, selecting a different folder, or register a new document.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {(searchTerm || typeFilter || disciplineFilter || statusFilter || selectedFolderId !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          handleSelectFolder(null);
                          setStatusFilter('');
                        }}
                        className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                      >
                        {isRtl ? 'مسح كل الفلاتر' : 'Clear All Filters'}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsAddDocOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{isRtl ? 'إضافة وثيقة جديدة الآن' : 'Add First Document'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse" role="table" aria-label={isRtl ? 'سجل الوثائق الهندسية والمخططات' : 'Engineering Documents Register'}>
                    <caption className="sr-only">
                      {isRtl ? 'جدول الوثائق والمخططات الهندسية المعتمدة' : 'Controlled Engineering Documents and Drawings Table'}
                    </caption>
                    <thead
                      className={`text-xs text-gray-600 uppercase bg-gray-50/90 dark:bg-gray-900/60 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 sticky top-0 ${
                        isRtl ? 'text-right' : 'text-left'
                      }`}
                    >
                      <tr>
                        <th scope="col" className="px-4 py-3.5">{isRtl ? 'رقم الوثيقة' : 'Doc No.'}</th>
                        <th scope="col" className="px-4 py-3.5 min-w-[200px]">{isRtl ? 'العنوان وتفاصيل المخطط' : 'Title & Description'}</th>
                        <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'المراجعة' : 'Rev'}</th>
                        <th scope="col" className="px-4 py-3.5">{isRtl ? 'النوع' : 'Type'}</th>
                        <th scope="col" className="px-4 py-3.5">{isRtl ? 'التخصص' : 'Discipline'}</th>
                        <th scope="col" className="px-4 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th scope="col" className="px-4 py-3.5">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                        <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {filteredDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-blue-50/40 dark:bg-blue-950/40 dark:hover:bg-gray-800/60 transition-colors group"
                        >
                          {/* Document Number with LTR Isolation */}
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span 
                              dir="ltr" 
                              className="font-mono font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 select-all tracking-tight block"
                            >
                              {doc.document_number}
                            </span>
                            {doc.file_size_bytes && (
                              <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                {(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            )}
                          </td>

                          {/* Titles with Proper RTL/LTR Wrapping & Isolation */}
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 max-w-sm sm:max-w-md">
                              <div 
                                className="font-medium text-gray-900 dark:text-white leading-snug break-words"
                                dir="auto"
                              >
                                {isRtl ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar}
                              </div>
                              {doc.title_en && isRtl && (
                                <div className="text-xs text-gray-400 dark:text-gray-400 font-sans leading-normal break-words" dir="ltr">
                                  {doc.title_en}
                                </div>
                              )}
                              {!isRtl && doc.title_ar && (
                                <div className="text-xs text-gray-400 dark:text-gray-400 font-sans leading-normal break-words" dir="rtl">
                                  {doc.title_ar}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Revision Badge */}
                          <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                            <RevisionBadge revision={doc.revision} status={doc.status} isRtl={isRtl} />
                          </td>

                          {/* Doc Type */}
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <DocTypeTag type={doc.type} isRtl={isRtl} />
                          </td>

                          {/* Discipline */}
                          <td className="px-4 py-3 align-top capitalize text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                            <DisciplineBadge discipline={doc.discipline} isRtl={isRtl} />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <StatusBadge status={doc.status} isRtl={isRtl} />
                          </td>

                          {/* Issue Date */}
                          <td className="px-4 py-3 align-top text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs font-mono">
                            {doc.issued_date ? new Date(doc.issued_date).toLocaleDateString() : '-'}
                          </td>

                          {/* Actions: Accessible Preview Link & Revise Button */}
                          <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Preview / Quick View Button */}
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                aria-label={isRtl ? `معاينة وثيقة ${doc.document_number}` : `Preview document ${doc.document_number}`}
                                title={isRtl ? 'معاينة الوثيقة' : 'Preview Document'}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* External Direct Link if available */}
                              {(() => {
                                const safeFileUrl = safeHttpUrl(doc.file_url);
                                if (safeFileUrl) {
                                  return (
                                    <a
                                      href={safeFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={isRtl ? `فتح ملف ${doc.document_number} في نافذة جديدة` : `Open file ${doc.document_number} in new window`}
                                      title={isRtl ? 'فتح الرابط المباشر للملف' : 'Open direct file URL'}
                                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-gray-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  );
                                }
                                if (canEdit) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openRevisionForDoc(doc)}
                                      aria-label={isRtl ? 'إرفاق ملف' : 'Attach file'}
                                      title={isRtl ? 'إرفاق ملف جديد للوثيقة' : 'Attach file to document'}
                                      className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:bg-amber-950/40 dark:hover:bg-amber-950/30 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                    >
                                      <UploadCloud className="w-4 h-4" />
                                    </button>
                                  );
                                }
                                return null;
                              })()}

                              {/* Issue New Revision Button */}
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openRevisionForDoc(doc)}
                                  aria-label={isRtl ? `إصدار مراجعة جديدة للوثيقة ${doc.document_number}` : `Issue new revision for ${doc.document_number}`}
                                  title={isRtl ? 'إصدار مراجعة جديدة' : 'Issue New Revision'}
                                  className="px-2 py-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md flex items-center gap-1 text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                  <GitBranch className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{isRtl ? 'مراجعة' : 'Revise'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Tab 2: Transmittals Register & Tracking */}
        {activeTab === 'transmittals' && (
          <div className="p-0">
            {transmittalsLoading ? (
              <TransmittalTableSkeleton isRtl={isRtl} />
            ) : filteredTransmittals.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                <Send className="h-12 w-12 mx-auto mb-3 opacity-20 text-purple-600" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {isRtl ? 'لا توجد خطابات إرسال مسجلة' : 'No transmittals recorded'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {isRtl ? 'يمكنك إنشاء خطاب إرسال رسمي جديد لإرسال المخططات والاعتمادات للاستشاري أو المالك' : 'You can issue a formal document transmittal for approval or construction to consultant/client'}
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsNewTransmittalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium transition-colors shadow-2xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isRtl ? 'إصدار خطاب إرسال جديد الآن' : 'Issue New Transmittal'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse" role="table" aria-label={isRtl ? 'جدول خطابات الإرسال الرسمية' : 'Transmittal Tracking Table'}>
                  <thead
                    className={`text-xs text-gray-600 uppercase bg-gray-50/90 dark:bg-gray-900/60 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                  >
                    <tr>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'رقم الخطاب الرسمي' : 'Transmittal No.'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'الغرض الهندسي' : 'Purpose'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'الجهة المرسلة' : 'Sender'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'الجهة المستلمة' : 'Recipient'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'تاريخ الإرسال' : 'Date'}</th>
                      <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'عدد الوثائق' : 'Docs'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'تفاصيل' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {filteredTransmittals.map((trn) => (
                      <tr
                        key={trn.id}
                        onClick={() => setViewTransmittal(trn)}
                        className="hover:bg-purple-50/40 dark:bg-purple-950/40 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5 font-semibold">
                          <span dir="ltr" className="font-mono text-purple-600 dark:text-purple-400 select-all block text-xs sm:text-sm">
                            {trn.transmittal_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <TransmittalPurposeBadge purpose={trn.purpose} isRtl={isRtl} />
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 text-xs">
                          {trn.sender}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 text-xs">
                          {trn.recipient}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs font-mono">
                          {trn.transmission_date ? new Date(trn.transmission_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 rounded-full font-mono font-semibold text-xs border border-gray-200 dark:border-gray-600">
                            {trn.documents_count}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <TransmittalStatusBadge status={trn.status} isRtl={isRtl} />
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewTransmittal(trn);
                            }}
                            aria-label={isRtl ? `عرض تفاصيل خطاب ${trn.transmittal_number}` : `View transmittal ${trn.transmittal_number}`}
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:bg-purple-900/40 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recent Revisions Register */}
        {activeTab === 'revisions' && (
          <div className="p-0">
            {docsLoading ? (
              <TableSkeleton isRtl={isRtl} />
            ) : revisionDocs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20 text-emerald-600" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {isRtl ? 'لا توجد مراجعات مسجلة' : 'No revisions found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse" role="table" aria-label={isRtl ? 'سجل تتبع المراجعات الهندسية' : 'Revision History Register'}>
                  <thead
                    className={`text-xs text-gray-600 uppercase bg-gray-50/90 dark:bg-gray-900/60 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                  >
                    <tr>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'رقم الوثيقة' : 'Doc No.'}</th>
                      <th scope="col" className="px-4 py-3.5 min-w-[200px]">{isRtl ? 'العنوان' : 'Title'}</th>
                      <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'المراجعة الحالية' : 'Current Rev'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'التخصص' : 'Discipline'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th scope="col" className="px-4 py-3.5">{isRtl ? 'تاريخ آخر تعديل' : 'Last Updated'}</th>
                      {canEdit && (
                        <th scope="col" className="px-4 py-3.5 text-center">{isRtl ? 'إصدار مراجعة' : 'Revise'}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {revisionDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-emerald-50/30 dark:bg-emerald-950/40 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          <span dir="ltr" className="font-mono text-xs sm:text-sm text-blue-600 dark:text-blue-400 select-all block">
                            {doc.document_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5 max-w-sm sm:max-w-md">
                            <div className="font-medium text-gray-800 dark:text-gray-200 break-words" dir="auto">
                              {isRtl ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar}
                            </div>
                            {doc.title_en && isRtl && (
                              <div className="text-xs text-gray-400 font-sans break-words" dir="ltr">{doc.title_en}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <RevisionBadge revision={doc.revision} status={doc.status} isRtl={isRtl} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          <DisciplineBadge discipline={doc.discipline} isRtl={isRtl} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={doc.status} isRtl={isRtl} />
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs font-mono">
                          {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : '-'}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openRevisionForDoc(doc)}
                              aria-label={isRtl ? `تحديث مراجعة ${doc.document_number}` : `Update revision for ${doc.document_number}`}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'إصدار مراجعة' : 'New Rev'}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          onRevise={() => {
            if (!canEdit) return;
            const d = previewDoc;
            setPreviewDoc(null);
            openRevisionForDoc(d);
          }}
          canEdit={canEdit}
          isRtl={isRtl}
        />
      )}

      {/* Accessible Transmittal Detail Modal */}
      {viewTransmittal && (
        <TransmittalDetailModal
          transmittal={viewTransmittal}
          isOpen={!!viewTransmittal}
          onClose={() => setViewTransmittal(null)}
          isRtl={isRtl}
        />
      )}

      {/* Action Modals */}
      {canEdit && (
        <>
          <AddDocumentModal
            isOpen={isAddDocOpen}
            onClose={() => setIsAddDocOpen(false)}
            projectId={currentProjectId}
            onSuccess={handleDocumentCreated}
          />

          <NewTransmittalModal
            isOpen={isNewTransmittalOpen}
            onClose={() => setIsNewTransmittalOpen(false)}
            projectId={currentProjectId}
            onSuccess={handleTransmittalCreated}
          />

          <NewRevisionModal
            isOpen={isNewRevisionOpen}
            onClose={() => setIsNewRevisionOpen(false)}
            document={selectedDocForRevision}
            documents={documents}
            projectId={currentProjectId}
            onSuccess={handleDocumentCreated}
          />
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Skeletons & Polished UI Components
// -------------------------------------------------------------

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-mono">{value}</h3>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-gray-100 dark:border-gray-700">
          {icon}
        </div>
      </div>
      {subtitle && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="h-2.5 w-32 bg-gray-100 dark:bg-gray-700/60 rounded mt-3" />
    </div>
  );
}

function TableSkeleton({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="p-4 space-y-3 animate-pulse" aria-busy="true">
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-1.5 max-w-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded hidden sm:block" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function TransmittalTableSkeleton({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="p-4 space-y-3 animate-pulse" aria-busy="true">
      <div className="h-8 bg-purple-50 dark:bg-purple-950/20 rounded-lg w-full mb-2" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-24 bg-purple-100 dark:bg-purple-950/40 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded hidden md:block" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded hidden md:block" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-gray-800 rounded-t-lg'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:border-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
            active
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Revision Badge with Distinct Version Styling
 */
function RevisionBadge({ revision, status, isRtl }: { revision: string; status: DocStatus; isRtl?: boolean }) {
  const isApproved = status === 'approved';
  const isSuperseded = status === 'superseded';
  const label = isRtl ? `مراجعة ${revision}` : `Rev.${revision}`;

  if (isApproved) {
    return (
      <span 
        dir="ltr"
        title={isRtl ? 'مراجعة معتمدة ومصادق عليها' : 'Approved Revision'}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs"
      >
        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span>{label}</span>
      </span>
    );
  }

  if (isSuperseded) {
    return (
      <span 
        dir="ltr"
        title={isRtl ? 'مراجعة مستبدلة بمراجعة أحدث' : 'Superseded Revision'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 line-through border border-gray-200 dark:border-gray-700"
      >
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span 
      dir="ltr"
      title={isRtl ? `إصدار مراجعة ${revision}` : `Revision ${revision}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-2xs"
    >
      <GitBranch className="w-3 h-3 text-gray-400" />
      <span>{label}</span>
    </span>
  );
}

function StatusBadge({ status, isRtl }: { status: DocStatus; isRtl: boolean }) {
  const map: Record<DocStatus, { labelEn: string; labelAr: string; cls: string; icon: React.ReactNode }> = {
    approved: {
      labelEn: 'Approved',
      labelAr: 'معتمد',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
    },
    under_review: {
      labelEn: 'Under Review',
      labelAr: 'قيد المراجعة',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    },
    draft: {
      labelEn: 'Draft',
      labelAr: 'مسودة',
      cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      icon: <FileText className="w-3 h-3 text-gray-400" />,
    },
    superseded: {
      labelEn: 'Superseded',
      labelAr: 'مستبدل',
      cls: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800',
      icon: <AlertCircle className="w-3 h-3 text-red-600" />,
    },
    archived: {
      labelEn: 'Archived',
      labelAr: 'مؤرشف',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      icon: <Archive className="w-3 h-3 text-blue-600" />,
    },
  };

  const config = map[status] || map.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
      {config.icon}
      <span>{isRtl ? config.labelAr : config.labelEn}</span>
    </span>
  );
}

function DocTypeTag({ type, isRtl }: { type: DocType; isRtl: boolean }) {
  const map: Record<DocType, { labelEn: string; labelAr: string; icon: React.ReactNode }> = {
    drawing: { labelEn: 'Drawing', labelAr: 'مخطط', icon: <Layers className="w-3 h-3 text-blue-500" /> },
    specification: { labelEn: 'Specification', labelAr: 'مواصفات', icon: <FileText className="w-3 h-3 text-indigo-500" /> },
    submittal: { labelEn: 'Submittal', labelAr: 'اعتماد', icon: <FileCheck2 className="w-3 h-3 text-green-500" /> },
    contract: { labelEn: 'Contract', labelAr: 'عقد', icon: <ShieldCheck className="w-3 h-3 text-amber-500" /> },
    report: { labelEn: 'Report', labelAr: 'تقرير', icon: <FileText className="w-3 h-3 text-purple-500" /> },
    certificate: { labelEn: 'Certificate', labelAr: 'شهادة', icon: <CheckCircle className="w-3 h-3 text-emerald-500" /> },
    correspondence: { labelEn: 'Correspondence', labelAr: 'مراسلة', icon: <Send className="w-3 h-3 text-sky-500" /> },
    other: { labelEn: 'Other', labelAr: 'أخرى', icon: <FileCode className="w-3 h-3 text-gray-500 dark:text-slate-400" /> },
  };

  const item = map[type] || map.other;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
      {item.icon}
      <span>{isRtl ? item.labelAr : item.labelEn}</span>
    </span>
  );
}

function DisciplineBadge({ discipline, isRtl }: { discipline?: string; isRtl: boolean }) {
  if (!discipline) return <span className="text-gray-400">-</span>;
  const d = discipline.toLowerCase();

  const labels: Record<string, { ar: string; en: string }> = {
    architectural: { ar: 'معماري', en: 'Architectural' },
    structural: { ar: 'إنشائي', en: 'Structural' },
    mep: { ar: 'كهروميكانيك', en: 'MEP' },
    civil: { ar: 'مدني', en: 'Civil' },
    infrastructure: { ar: 'بنية تحتية', en: 'Infra' },
    general: { ar: 'عام', en: 'General' },
  };

  const label = labels[d] ? (isRtl ? labels[d].ar : labels[d].en) : discipline;

  return (
    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-medium text-[11px]">
      {label}
    </span>
  );
}

function TransmittalStatusBadge({ status, isRtl }: { status: string; isRtl: boolean }) {
  const normalized = (status || '').toUpperCase();
  const map: Record<string, { labelEn: string; labelAr: string; cls: string; icon: React.ReactNode }> = {
    SENT: {
      labelEn: 'Sent',
      labelAr: 'تم الإرسال',
      cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      icon: <Send className="w-3 h-3 text-purple-600" />,
    },
    RECEIVED: {
      labelEn: 'Received',
      labelAr: 'تم الاستلام',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      icon: <Inbox className="w-3 h-3 text-blue-600" />,
    },
    ACKNOWLEDGED: {
      labelEn: 'Acknowledged',
      labelAr: 'تم تأكيد الاستلام والرد',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      icon: <CheckCheck className="w-3 h-3 text-emerald-600" />,
    },
    CLOSED: {
      labelEn: 'Closed',
      labelAr: 'مغلق ومكتمل',
      cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      icon: <Archive className="w-3 h-3 text-gray-500 dark:text-slate-400" />,
    },
  };

  const config = map[normalized] || {
    labelEn: status,
    labelAr: status,
    cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    icon: <Clock className="w-3 h-3 text-gray-500 dark:text-slate-400" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
      {config.icon}
      <span>{isRtl ? config.labelAr : config.labelEn}</span>
    </span>
  );
}

function TransmittalPurposeBadge({ purpose, isRtl }: { purpose: string; isRtl: boolean }) {
  const p = (purpose || '').toLowerCase();
  const map: Record<string, { labelEn: string; labelAr: string; cls: string }> = {
    for_approval: { labelEn: 'For Approval', labelAr: 'للاعتماد والمصادقة', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    for_review: { labelEn: 'For Review', labelAr: 'للمراجعة وإبداء الملاحظات', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    for_construction: { labelEn: 'For Construction (IFC)', labelAr: 'صالح للتنفيذ بالموقع', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold' },
    for_information: { labelEn: 'For Information', labelAr: 'للعلم والإحاطة', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    as_built: { labelEn: 'As-Built', labelAr: 'مطابق للمنفذ على الطبيعة', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' },
  };

  const item = map[p] || { labelEn: purpose.replace(/_/g, ' '), labelAr: purpose.replace(/_/g, ' '), cls: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200' };

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium inline-block capitalize ${item.cls}`}>
      {isRtl ? item.labelAr : item.labelEn}
    </span>
  );
}

// -------------------------------------------------------------
// Accessible Document Preview Modal
// -------------------------------------------------------------
function DocumentPreviewModal({
  doc,
  isOpen,
  onClose,
  onRevise,
  canEdit,
  isRtl,
}: {
  doc: ControlledDocument;
  isOpen: boolean;
  onClose: () => void;
  onRevise: () => void;
  canEdit: boolean;
  isRtl: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const safeFileUrl = safeHttpUrl(doc.file_url);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyDocNumber = () => {
    navigator.clipboard.writeText(doc.document_number);
    setCopied(true);
    toast.success(isRtl ? 'تم نسخ رقم الوثيقة' : 'Document number copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-doc-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between bg-gray-50/70 dark:bg-gray-850">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                dir="ltr" 
                className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400 select-all"
              >
                {doc.document_number}
              </span>
              <button
                type="button"
                onClick={copyDocNumber}
                aria-label={isRtl ? 'نسخ رقم الوثيقة' : 'Copy document number'}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-gray-200 rounded"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <RevisionBadge revision={doc.revision} status={doc.status} isRtl={isRtl} />
              <StatusBadge status={doc.status} isRtl={isRtl} />
            </div>
            <h2 id="preview-doc-title" className="text-base font-semibold text-gray-900 dark:text-white mt-1.5 leading-snug">
              {isRtl ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar}
            </h2>
            {doc.title_en && isRtl && (
              <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{doc.title_en}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق المعاينة' : 'Close preview'}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
            <div>
              <span className="text-gray-400 block">{isRtl ? 'النوع' : 'Type'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize mt-0.5 block">{doc.type}</span>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'التخصص' : 'Discipline'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize mt-0.5 block">{doc.discipline || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono mt-0.5 block">
                {doc.issued_date ? new Date(doc.issued_date).toLocaleDateString() : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'حجم الملف' : 'File Size'}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono mt-0.5 block">
                {doc.file_size_bytes ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : isRtl ? 'غير محدد' : 'N/A'}
              </span>
            </div>
          </div>

          {/* Document Preview Frame or File Link */}
          {safeFileUrl ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[280px]" dir="ltr">
                  {safeFileUrl.split('/').pop() || 'document_file'}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={safeFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'فتح في نافذة جديدة' : 'Open in New Window'}</span>
                  </a>
                </div>
              </div>
              <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-3 text-blue-500 opacity-60" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {isRtl ? 'الملف جاهز للتحميل والعرض' : 'File is ready for viewing & download'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto" dir="ltr">
                  {safeFileUrl}
                </p>
                <a
                  href={safeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? 'تحميل الوثيقة' : 'Download Document'}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <UploadCloud className="w-12 h-12 mx-auto mb-2 text-gray-400 opacity-60" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRtl ? 'لم يتم إرفاق ملف إلكتروني بعد لهذه الوثيقة' : 'No electronic file attached to this document'}
              </p>
              {canEdit && (
                <>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRtl ? 'يمكنك رفع المخطط أو العقد عبر إصدار مراجعة جديدة' : 'You can attach the PDF/CAD file by issuing a new revision'}
                  </p>
                  <button
                    type="button"
                    onClick={onRevise}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إصدار مراجعة وإرفاق ملف' : 'Revise & Attach File'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-850">
          {canEdit ? (
            <button
              type="button"
              onClick={onRevise}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{isRtl ? 'إصدار مراجعة جديدة' : 'Issue Revision'}</span>
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors font-medium"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Accessible Transmittal Detail Modal
// -------------------------------------------------------------
function TransmittalDetailModal({
  transmittal,
  isOpen,
  onClose,
  isRtl,
}: {
  transmittal: DocumentTransmittal;
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyTransmittalNo = () => {
    navigator.clipboard.writeText(transmittal.transmittal_number);
    setCopied(true);
    toast.success(isRtl ? 'تم نسخ رقم خطاب الإرسال' : 'Transmittal number copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transmittal-detail-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between bg-purple-50/40 dark:bg-purple-950/20">
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 id="transmittal-detail-title" className="text-base font-bold text-gray-900 dark:text-white">
                {isRtl ? 'خطاب إرسال وثائق ومخططات' : 'Document Transmittal Slip'}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span dir="ltr" className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400 select-all">
                {transmittal.transmittal_number}
              </span>
              <button
                type="button"
                onClick={copyTransmittalNo}
                aria-label={isRtl ? 'نسخ رقم الخطاب' : 'Copy transmittal number'}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-gray-200 rounded"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <TransmittalStatusBadge status={transmittal.status} isRtl={isRtl} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-gray-400 block">{isRtl ? 'الجهة المرسلة' : 'Sender Organization'}</span>
              <span className="font-semibold text-gray-900 dark:text-white mt-1 block">{transmittal.sender}</span>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'الجهة المستلمة' : 'Recipient Organization'}</span>
              <span className="font-semibold text-gray-900 dark:text-white mt-1 block">{transmittal.recipient}</span>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'الغرض من الإرسال' : 'Transmission Purpose'}</span>
              <div className="mt-1">
                <TransmittalPurposeBadge purpose={transmittal.purpose} isRtl={isRtl} />
              </div>
            </div>
            <div>
              <span className="text-gray-400 block">{isRtl ? 'تاريخ الخطاب الرسمي' : 'Transmission Date'}</span>
              <span className="font-semibold text-gray-900 dark:text-white font-mono mt-1 block">
                {transmittal.transmission_date ? new Date(transmittal.transmission_date).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-xs">
                  {isRtl ? 'الوثائق والمخططات المرفقة بالخطاب' : 'Attached Documents Count'}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {isRtl ? 'مخططات ورقية ونسخ إلكترونية معتمدة' : 'Official drawings & submittal package'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm rounded-lg border border-blue-200 dark:border-blue-800">
              {transmittal.documents_count} {isRtl ? 'مستند مسجل' : 'docs'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-850">
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRtl ? 'طباعة بطاقة الإرسال' : 'Print Slip'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors font-medium"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
