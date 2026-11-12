'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
  Check,
  X,
  Filter,
  ExternalLink,
  Building2,
} from 'lucide-react';
import {
  Deliverable,
  DeliverableItem,
  ProjectActivity,
} from '@/types/planning';
import { Project, Stakeholder, RaciRole } from '@/types';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { ActivityService } from '@/lib/services/activity.service';
import { appCache } from '@/lib/cache';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

export interface TOManagerAssignmentPanelProps {
  projectId?: string;
  projectName?: string;
  onAssignmentChanged?: (itemId: string, assignedStakeholderId: string) => void;
  onAssignmentComplete?: () => void;
}

export interface EnrichedTOEngineer extends Stakeholder {
  isAssignedToProject: boolean;
  is_active?: boolean;
  role_in_project?: string;
  raci_role?: RaciRole;
  specialty?: string;
  department?: string;
}

export type DisciplineFilterKey = 'all' | 'civil' | 'mep' | 'arch';

const DISCIPLINE_FILTERS: Array<{
  key: DisciplineFilterKey;
  labelAr: string;
  labelEn: string;
  keywords: string[];
}> = [
  {
    key: 'all',
    labelAr: 'الكل',
    labelEn: 'All',
    keywords: [],
  },
  {
    key: 'civil',
    labelAr: 'مدني وإنشائي',
    labelEn: 'Civil & Structural',
    keywords: ['مدني', 'إنشائي', 'انشائي', 'خرسان', 'حديد', 'civil', 'struct', 'str', 'civ'],
  },
  {
    key: 'mep',
    labelAr: 'كهروميكانيكا ومسطحات مائية',
    labelEn: 'MEP & Water Features',
    keywords: [
      'كهروميكانيك',
      'ميكانيك',
      'كهربا',
      'مسطحات',
      'مائية',
      'مائيه',
      'شلال',
      'نافور',
      'مضخ',
      'سباك',
      'صحي',
      'mep',
      'mech',
      'elec',
      'plumb',
      'water',
      'fountain',
      'lagoon',
      'pool',
    ],
  },
  {
    key: 'arch',
    labelAr: 'معماري',
    labelEn: 'Architectural',
    keywords: ['معماري', 'عمارة', 'تشطيب', 'لاندسكيب', 'تنسيق مواقع', 'arch', 'landscape', 'interior', 'finish'],
  },
];

const VALID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function matchesDisciplineKeywords(text: string, disciplineKey: DisciplineFilterKey): boolean {
  if (disciplineKey === 'all') return true;
  const config = DISCIPLINE_FILTERS.find((d) => d.key === disciplineKey);
  if (!config) return true;
  const normalized = text.toLowerCase();
  return config.keywords.some((kw) => normalized.includes(kw));
}

export interface ItemWithContext extends DeliverableItem {
  deliverable_ref?: string;
  deliverable_title?: string;
  deliverable_discipline?: string;
  project_id?: string;
  project_name?: string;
}

export const TOManagerAssignmentPanel: React.FC<TOManagerAssignmentPanelProps> = ({
  projectId: propProjectId,
  projectName: propProjectName,
  onAssignmentChanged,
  onAssignmentComplete,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || 'all');
  const [engineers, setEngineers] = useState<EnrichedTOEngineer[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineFilterKey>('all');
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Draft changes per item before commit { [itemId]: { engineerId, dueDate, activityId } }
  const [draftAssignments, setDraftAssignments] = useState<
    Record<string, { engineerId: string; dueDate: string; activityId: string }>
  >({});

  // Multi-selection for bulk assignment
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkEngineerId, setBulkEngineerId] = useState<string>('');
  const [bulkDueDate, setBulkDueDate] = useState<string>('');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string } | null>(null);

  // Sync propProjectId if updated externally
  useEffect(() => {
    if (propProjectId) {
      setSelectedProjectId(propProjectId);
    }
  }, [propProjectId]);

  // Load Projects on mount
  useEffect(() => {
    async function loadProjectsList() {
      try {
        const prjs = await ProjectService.getProjects({});
        setProjects(prjs);
      } catch (err) {
        logger.warn('Error loading reference projects', { detail: err });
      }
    }
    loadProjectsList();
  }, []);

  const resolvedTargetProjectId = useMemo(() => {
    if (selectedProjectId && selectedProjectId !== 'all') return selectedProjectId;
    if (propProjectId && propProjectId !== 'all') return propProjectId;
    return '';
  }, [selectedProjectId, propProjectId]);

  // Strictly load ONLY Project Stakeholders assigned to the active project(s) (never dump unassigned company directory)
  const loadEngineersForProject = useCallback(async () => {
    try {
      let projectStakeholdersList: Awaited<ReturnType<typeof ProjectService.getProjectStakeholders>> = [];

      if (resolvedTargetProjectId) {
        projectStakeholdersList = await ProjectService.getProjectStakeholders(resolvedTargetProjectId);
      } else if (projects.length > 0) {
        const results = await Promise.all(
          projects.slice(0, 15).map((p) => ProjectService.getProjectStakeholders(p.id))
        );
        projectStakeholdersList = results.flat();
      }

      const mergedMap = new Map<string, EnrichedTOEngineer>();

      (projectStakeholdersList || []).forEach((ps) => {
        const psAny = ps as any;
        if (psAny.is_active === false) return;
        if (ps.stakeholder && ps.stakeholder.is_active === false) return;
        if (psAny.end_date && new Date(psAny.end_date).getTime() <= Date.now()) return;

        const partyKind = ps.party_kind || ps.stakeholder?.stakeholder_kind || 'employee';
        if (partyKind !== 'employee') return;

        const stkId = ps.stakeholder_id || ps.stakeholder?.id || '';
        if (!VALID_UUID_REGEX.test(stkId)) return;

        const stkAny = (ps.stakeholder || {}) as any;
        const existing = mergedMap.get(stkId);
        const roleInProject = ps.project_role || ps.stakeholder?.role || '';

        if (existing) {
          // Merge project roles if assigned across multiple projects in 'all' view
          const combinedRole =
            existing.role_in_project && roleInProject && !existing.role_in_project.includes(roleInProject)
              ? `${existing.role_in_project} • ${roleInProject}`
              : existing.role_in_project || roleInProject;
          mergedMap.set(stkId, {
            ...existing,
            role_in_project: combinedRole,
          });
          return;
        }

        mergedMap.set(stkId, {
          ...(ps.stakeholder || {}),
          id: stkId,
          name_ar: ps.stakeholder?.name_ar || stkAny.name || 'مهندس المكتب الفني',
          name_en: ps.stakeholder?.name_en || ps.stakeholder?.name_ar || '',
          role: ps.stakeholder?.role || ps.project_role || '',
          stakeholder_kind: 'employee',
          is_active: true,
          isAssignedToProject: true,
          role_in_project: roleInProject,
          raci_role: ps.raci_role,
          specialty: stkAny.specialty || psAny.specialty || '',
          department: stkAny.department || psAny.department || '',
        });
      });

      const sortedEngineers = Array.from(mergedMap.values()).sort((a, b) =>
        (a.name_ar || '').localeCompare(b.name_ar || '', 'ar')
      );

      setEngineers(sortedEngineers);
    } catch (err) {
      logger.warn('Error loading project stakeholders for TO assignment', { detail: err });
    }
  }, [resolvedTargetProjectId, projects]);

  useEffect(() => {
    loadEngineersForProject();
  }, [loadEngineersForProject]);

  // Load Deliverables and Activities for chosen project
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (selectedProjectId === 'all') {
        // Load deliverables across first few active projects or all available
        const allDeliverables: Deliverable[] = [];
        for (const prj of projects.slice(0, 10)) {
          const list = await DeliverablesService.getDeliverables(prj.id, 'all');
          allDeliverables.push(...list);
        }
        setDeliverables(allDeliverables);
        setActivities([]);
      } else {
        const [delivs, acts] = await Promise.all([
          DeliverablesService.getDeliverables(selectedProjectId, 'all'),
          ActivityService.getActivities(selectedProjectId),
        ]);
        setDeliverables(delivs);
        setActivities(acts);
      }
      setSelectedItemIds([]);
    } catch (err) {
      logger.error('Error loading deliverables for assignment', { detail: err });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0 || (selectedProjectId && selectedProjectId !== 'all')) {
      loadData();
    }
  }, [selectedProjectId, projects]);

  // Flatten all deliverable items with parent deliverable context
  const allItems: ItemWithContext[] = useMemo(() => {
    const list: ItemWithContext[] = [];
    deliverables.forEach((del) => {
      const prj = projects.find((p) => p.id === del.project_id);
      const delAny = del as any;
      (del.items || []).forEach((it) => {
        list.push({
          ...it,
          deliverable_ref: del.ref_code,
          deliverable_title: del.title_ar,
          deliverable_discipline: delAny.discipline || delAny.category || '',
          project_id: del.project_id,
          project_name: prj?.project_name || prj?.project_code || propProjectName || '',
        });
      });
    });
    return list;
  }, [deliverables, projects, propProjectName]);

  // Filter engineers by selected discipline
  const filteredEngineers = useMemo(() => {
    if (selectedDiscipline === 'all') return engineers;
    const matched = engineers.filter((eng) => {
      const haystack = [
        eng.role_in_project,
        eng.specialty,
        eng.department,
        eng.role,
        eng.name_ar,
      ]
        .filter(Boolean)
        .join(' ');
      return matchesDisciplineKeywords(haystack, selectedDiscipline);
    });
    // Fallback to all engineers if no engineer has discipline metadata yet, keeping matched ones if any
    return matched.length > 0 ? matched : engineers;
  }, [engineers, selectedDiscipline]);

  // Calculate workload per engineer (respecting discipline filter)
  const workloadStats = useMemo(() => {
    const map = new Map<string, number>();
    allItems.forEach((it) => {
      if (it.assigned_stakeholder_id && it.status !== 'returned') {
        map.set(
          it.assigned_stakeholder_id,
          (map.get(it.assigned_stakeholder_id) || 0) + 1
        );
      }
    });

    return filteredEngineers.map((eng) => {
      const count = map.get(eng.id) || 0;
      let level: 'light' | 'optimal' | 'heavy' = 'light';
      if (count > 10) level = 'heavy';
      else if (count >= 4) level = 'optimal';

      return {
        ...eng,
        assignedCount: count,
        level,
      };
    });
  }, [allItems, filteredEngineers]);

  // Filtered Deliverable Items
  const filteredItems = useMemo(() => {
    // Check if any item explicitly matches the selected discipline before strict filtering
    const anyItemMatchesDiscipline =
      selectedDiscipline === 'all' ||
      allItems.some((it) => {
        const itemText = [
          it.deliverable_discipline,
          it.sheet_number,
          it.description,
          it.deliverable_title,
          it.deliverable_ref,
        ]
          .filter(Boolean)
          .join(' ');
        return matchesDisciplineKeywords(itemText, selectedDiscipline);
      });

    return allItems.filter((item) => {
      if (unassignedOnly && item.assigned_stakeholder_id) return false;

      if (selectedDiscipline !== 'all' && anyItemMatchesDiscipline) {
        const itemText = [
          item.deliverable_discipline,
          item.sheet_number,
          item.description,
          item.deliverable_title,
          item.deliverable_ref,
        ]
          .filter(Boolean)
          .join(' ');
        if (!matchesDisciplineKeywords(itemText, selectedDiscipline)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sheet = (item.sheet_number || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const ref = (item.deliverable_ref || '').toLowerCase();
        const title = (item.deliverable_title || '').toLowerCase();
        const prj = (item.project_name || '').toLowerCase();

        if (
          !sheet.includes(q) &&
          !desc.includes(q) &&
          !ref.includes(q) &&
          !title.includes(q) &&
          !prj.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, unassignedOnly, selectedDiscipline, searchQuery]);

  // Initialize draft values for each item
  const getDraftFor = (item: ItemWithContext) => {
    if (draftAssignments[item.id]) {
      return draftAssignments[item.id];
    }
    return {
      engineerId: item.assigned_stakeholder_id || '',
      dueDate: item.due_date || '',
      activityId: item.linked_activity_id || '',
    };
  };

  const updateDraft = (itemId: string, field: 'engineerId' | 'dueDate' | 'activityId', value: string) => {
    setDraftAssignments((prev) => {
      const existing = prev[itemId] || {
        engineerId: allItems.find((i) => i.id === itemId)?.assigned_stakeholder_id || '',
        dueDate: allItems.find((i) => i.id === itemId)?.due_date || '',
        activityId: allItems.find((i) => i.id === itemId)?.linked_activity_id || '',
      };
      return {
        ...prev,
        [itemId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  // Save Single Assignment
  const handleSaveSingle = async (item: ItemWithContext) => {
    const draft = getDraftFor(item);
    if (!draft.engineerId) {
      setFeedback({
        type: 'error',
        message: isAr ? 'يرجى اختيار المهندس المكلف من طاقم المشروع' : 'Please select a project stakeholder',
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      const result = await TOProgressService.assignDeliverableItem({
        itemId: item.id,
        assignedStakeholderId: draft.engineerId,
        assignedBy: user?.id || 'TO Manager',
        dueDate: draft.dueDate || null,
        linkedActivityId: draft.activityId || null,
      });

      if (!result) throw new Error('Failed to assign deliverable item');

      setFeedback({
        type: 'success',
        message: isAr
          ? `تم إسناد المخطط ${item.sheet_number || ''} بنجاح إلى عضو طاقم المشروع`
          : `Assigned item ${item.sheet_number || ''} successfully`,
      });

      if (onAssignmentChanged) {
        onAssignmentChanged(item.id, draft.engineerId);
      }
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

      await loadData();
    } catch (err) {
      logger.error('Save assignment error', { detail: err });
      setFeedback({
        type: 'error',
        message: (err as Error).message || (isAr ? 'فشل حفظ الإسناد' : 'Failed to save assignment'),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Assignment Handler
  const handleBulkAssign = async () => {
    if (selectedItemIds.length === 0 || !bulkEngineerId) {
      setFeedback({
        type: 'error',
        message: isAr
          ? 'يرجى تحديد المخططات واختيار المهندس المستهدف من طاقم المشروع'
          : 'Please select items and choose an engineer',
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    let successCount = 0;

    for (const itemId of selectedItemIds) {
      try {
        const ok = await TOProgressService.assignDeliverableItem({
          itemId,
          assignedStakeholderId: bulkEngineerId,
          assignedBy: user?.id || 'TO Manager',
          dueDate: bulkDueDate || undefined,
        });
        if (ok) {
          successCount++;
          if (onAssignmentChanged) {
            onAssignmentChanged(itemId, bulkEngineerId);
          }
        }
      } catch (err) {
        logger.error('Bulk assign error for item', { detail: { itemId, error: err } });
      }
    }

    if (successCount > 0 && onAssignmentComplete) {
      onAssignmentComplete();
    }

    setFeedback({
      type: 'success',
      message: isAr
        ? `تم إسناد ${successCount} مخطط بنجاح للمهندس المحدد من طاقم المشروع`
        : `Successfully assigned ${successCount} items to the selected engineer`,
    });

    setSelectedItemIds([]);
    await loadData();
    setIsProcessing(false);
  };

  const handleFullRefresh = async () => {
    appCache.invalidate('project:stakeholders');
    appCache.invalidate('deliverables:');
    await Promise.all([loadEngineersForProject(), loadData()]);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((it) => it.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const projectStakeholdersHref = resolvedTargetProjectId
    ? `/projects/${resolvedTargetProjectId}?tab=team`
    : '/projects';

  return (
    <div className="space-y-5" data-testid="to-manager-assignment-panel">
      {/* Workload Balance Indicator Strip — Strictly Project Stakeholders */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isAr
                  ? 'طاقم المشروع المعتمد لتوزيع المهام (Project Stakeholders فقط)'
                  : 'Assigned Project Stakeholders Roster'}
              </span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-2xs">
              {filteredEngineers.length}{' '}
              {isAr ? 'عضو مكلف بالمشروع' : 'assigned members'}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {isAr
                ? '• مرتبط تلقائياً بجدول (الشركاء والعملاء) في صفحة المشروع'
                : '• Directly synced with Project Stakeholders tab'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={projectStakeholdersHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-black transition-all shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? 'إدارة الشركاء وطاقم المشروع في صفحة المشروع'
                  : 'Manage Project Stakeholders'}
              </span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {workloadStats.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2.5">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-xs font-black text-stone-800 dark:text-stone-200">
              {isAr
                ? 'لا يوجد مهندسون أو أعضاء مكلفون في تبويب (الشركاء والعملاء - Stakeholders) لهذا المشروع حالياً'
                : 'No internal stakeholders are currently assigned to this project'}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              {isAr
                ? 'يظهر هنا فقط الأشخاص المضافون داخل صفحة المشروع في تبويب (الشركاء والعملاء). قم بإضافة مهندسي المكتب الفني هناك ليظهروا فوراً هنا لتكليفهم بالمخططات.'
                : 'Only members added to the Project Stakeholders tab appear here. Add engineers in the project page to assign tasks.'}
            </p>
            <div className="pt-1">
              <Link
                href={projectStakeholdersHref}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'فتح تبويب الشركاء والعملاء في صفحة المشروع وإضافة المهندسين'
                    : 'Open Project Stakeholders Tab'}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {workloadStats.map((eng) => {
              const isEngBulkSelected = bulkEngineerId === eng.id;
              const badgeCls =
                eng.level === 'heavy'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/50'
                  : eng.level === 'optimal'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/50'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-900/50';

              const raciLetter = eng.raci_role ? eng.raci_role.charAt(0).toUpperCase() : 'R';

              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setBulkEngineerId((prev) => (prev === eng.id ? '' : eng.id))}
                  title={
                    isAr
                      ? `انقر لاختيار ${eng.name_ar} للإسناد الجماعي`
                      : `Click to select ${eng.name_ar} for bulk assignment`
                  }
                  className={`text-start p-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 space-y-1.5 ${
                    isEngBulkSelected
                      ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-sm'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-black text-stone-900 dark:text-white truncate">
                      {eng.name_ar}
                    </p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60">
                      {isAr ? `طاقم المشروع (${raciLetter})` : `Stakeholder (${raciLetter})`}
                    </span>
                  </div>
                  {(eng.role_in_project || eng.specialty || eng.department) && (
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate font-semibold">
                      {eng.role_in_project || eng.specialty || eng.department}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-black text-stone-700 dark:text-stone-300">
                      {eng.assignedCount} {isAr ? 'مخطط' : 'dwgs'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeCls}`}>
                      {eng.level === 'heavy'
                        ? isAr
                          ? 'مكتمل النصاب'
                          : 'Heavy'
                        : eng.level === 'optimal'
                        ? isAr
                          ? 'متوازن'
                          : 'Optimal'
                        : isAr
                        ? 'متاح للمهام'
                        : 'Light'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Bar: Discipline Filter, Search & Bulk Assign */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        {/* Discipline Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-stone-100 dark:border-stone-800">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1 me-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {isAr ? 'تصفية التخصص الهندسي:' : 'Discipline Filter:'}
          </span>
          {DISCIPLINE_FILTERS.map((disc) => {
            const isActive = selectedDiscipline === disc.key;
            return (
              <button
                key={disc.key}
                type="button"
                onClick={() => setSelectedDiscipline(disc.key)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-stone-900 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {isAr ? disc.labelAr : disc.labelEn}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم المخطط، اسم البند أو الرمز المرجعي...'
                  : 'Search by sheet, description or ref code...'
              }
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {!propProjectId && projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value="all">{isAr ? 'كل المشاريع' : 'All Projects'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name || p.project_code}
                  </option>
                ))}
              </select>
            )}

            {/* Unassigned Only Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 transition-colors">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <span>{isAr ? 'غير المسندة فقط' : 'Unassigned Only'}</span>
            </label>

            <button
              type="button"
              onClick={handleFullRefresh}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
              title={isAr ? 'تحديث طاقم المشروع والمخططات' : 'Refresh project stakeholders and items'}
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bulk Action Strip if items selected */}
        {selectedItemIds.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                {isAr ? `تم تحديد (${selectedItemIds.length}) مخطط:` : `Selected (${selectedItemIds.length}) items:`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkEngineerId}
                onChange={(e) => setBulkEngineerId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-stone-800 dark:text-stone-200 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value="">{isAr ? '-- اختر المهندس من طاقم المشروع --' : '-- Select Project Stakeholder --'}</option>
                {filteredEngineers.map((eng) => {
                  const roleLabel = eng.role_in_project ? ` (${eng.role_in_project})` : '';
                  return (
                    <option key={eng.id} value={eng.id}>
                      {eng.name_ar}{roleLabel}
                    </option>
                  );
                })}
              </select>

              <input
                type="date"
                value={bulkDueDate}
                onChange={(e) => setBulkDueDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />

              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={isProcessing || !bulkEngineerId}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {isAr ? 'إسناد دفعة واحدة' : 'Bulk Assign'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table of Items */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedItemIds.length === filteredItems.length && filteredItems.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
            <span>{isAr ? 'تحديد الكل' : 'Select All'}</span>
          </label>

          <span>
            {filteredItems.length} {isAr ? 'مخطط مدرج' : 'items listed'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RotateCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-medium">
              {isAr ? 'جاري تحميل مخططات المشروع...' : 'Loading items for assignment...'}
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/50 dark:border-emerald-800/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-stone-800 dark:text-stone-200">
              {isAr ? 'لا توجد مخططات مطابقة لشروط البحث' : 'No items match current filters'}
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60 overflow-x-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const draft = getDraftFor(item);
              const selectedEngineerObj = engineers.find((e) => e.id === draft.engineerId);

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('select, input, button, a, label')) return;
                    toggleSelectItem(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      const target = e.target as HTMLElement;
                      if (target.closest('select, input, button, a, label')) return;
                      e.preventDefault();
                      toggleSelectItem(item.id);
                    }
                  }}
                  tabIndex={0}
                  className={`p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/25 border-s-4 border-emerald-500'
                      : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/40 border-s-4 border-transparent'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                          {item.sheet_number || (isAr ? 'مخطط-000' : 'DWG-000')}
                        </span>
                        <span className="text-[11px] font-bold text-stone-500">
                          {isAr ? `إصدار ${item.current_rev ?? 0}` : `Rev ${item.current_rev ?? 0}`}
                        </span>
                        {item.deliverable_ref && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/40 dark:border-emerald-800/50">
                            {item.deliverable_ref}
                          </span>
                        )}
                        {item.project_name && (
                          <span className="text-[11px] text-stone-400 truncate max-w-[150px]">
                            • {item.project_name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-black text-stone-900 dark:text-white truncate">
                        {item.description || item.deliverable_title || (isAr ? 'مخطط تسليم' : 'Deliverable Item')}
                      </p>
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {/* Engineer Selector */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-56">
                        <select
                          value={draft.engineerId}
                          onChange={(e) => updateDraft(item.id, 'engineerId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <option value="">{isAr ? '-- غير مسند --' : '-- Unassigned --'}</option>
                          {filteredEngineers.map((eng) => {
                            const roleSuffix = eng.role_in_project ? ` (${eng.role_in_project})` : '';
                            return (
                              <option key={eng.id} value={eng.id}>
                                {eng.name_ar}{roleSuffix}
                              </option>
                            );
                          })}
                          {selectedEngineerObj && !filteredEngineers.some((e) => e.id === selectedEngineerObj.id) && (
                            <option value={selectedEngineerObj.id}>
                              {selectedEngineerObj.name_ar}
                              {selectedEngineerObj.role_in_project ? ` (${selectedEngineerObj.role_in_project})` : ''}
                            </option>
                          )}
                        </select>
                      </div>
                      {selectedEngineerObj && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60">
                          {selectedEngineerObj.role_in_project || (isAr ? 'طاقم المشروع' : 'Assigned')}
                        </span>
                      )}
                    </div>

                    {/* Due Date Picker */}
                    <div className="w-36">
                      <input
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) => updateDraft(item.id, 'dueDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      />
                    </div>

                    {/* Linked Activity (if activities loaded) */}
                    {activities.length > 0 && (
                      <div className="w-40">
                        <select
                          value={draft.activityId}
                          onChange={(e) => updateDraft(item.id, 'activityId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <option value="">{isAr ? '-- نشاط الجدول الزمني --' : '-- Schedule Activity --'}</option>
                          {activities.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.activity_code} - {act.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Save Assignment Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveSingle(item)}
                      disabled={isProcessing || !draft.engineerId}
                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 active:scale-95"
                      title={isAr ? 'حفظ الإسناد' : 'Save assignment'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
