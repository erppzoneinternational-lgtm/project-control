'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Layers, 
  HardHat, 
  Truck, 
  CloudSun, 
  Calendar, 
  Building2, 
  Sparkles,
  X,
  FileCheck2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  Droplet,
  Maximize2
} from 'lucide-react';
import { 
  DailyProgress, 
  DailyProgressLine, 
  DailyDiscipline, 
  InspectionStatus, 
} from '@/types/planning';
import { BoqItem, ProjectSubcontractor, Project } from '@/types';
import { DailyProgressService, OpenSiteTaskOption } from '@/lib/services/dailyProgress.service';
import { BoqService } from '@/lib/services/boq.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { useDailyDraftStore } from '@/lib/stores/useDailyDraftStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import type { InspectionType } from '@/types/task-ontology';
import { PriceGate, canViewPrices } from '@/components/planning/PriceGate';
import { validateSafeUploadFile } from '@/lib/utils/security';
import { logger } from '@/lib/logger';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { emitAtsmatrixEvent } from '@/lib/services/atsmatrix.service';
import { NotificationService } from '@/lib/services/notification.service';
import { DailyPhotoModal } from './DailyPhotoModal';

/** Daily progress line extended with optional QC inspection request fields (UI-only). */
type DailyProgressLineDraft = Partial<DailyProgressLine> & {
  needs_qc_inspection?: boolean;
  qc_inspection_type?: InspectionType;
  qc_required_date?: string;
  qc_notes?: string;
};

interface DailyProgressFormProps {
  projectId?: string;
  projects?: Project[];
  /** Optional site task to preselect (Site Workspace opens this form per-task). */
  preselectedSiteTaskId?: string;
  /** Optional existing report to edit/resume */
  initialReport?: DailyProgress | null;
  onSuccess?: (report: DailyProgress) => void;
  onCancel?: () => void;
}

export const DISCIPLINE_LABELS: Record<
  DailyDiscipline, 
  { labelAr: string; color: string; border: string; icon: React.ElementType }
> = {
  civil: { 
    labelAr: 'أعمال مدنية وإنشائية', 
    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300', 
    border: 'border-blue-200 dark:border-blue-800/60',
    icon: Building2 
  },
  finishing: { 
    labelAr: 'أعمال تشطيبات', 
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', 
    border: 'border-emerald-200 dark:border-emerald-800/60',
    icon: Sparkles 
  },
  mep: { 
    labelAr: 'أعمال كهروميكانيكية (MEP)', 
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300', 
    border: 'border-amber-200 dark:border-amber-800/60',
    icon: Zap 
  },
  landscape: { 
    labelAr: 'أعمال اللاندسكيب والموقع العام', 
    color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300', 
    border: 'border-teal-200 dark:border-teal-800/60',
    icon: Layers 
  },
  water_features: { 
    labelAr: 'حمامات سباحة وبحيرات', 
    color: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300', 
    border: 'border-cyan-200 dark:border-cyan-800/60',
    icon: Droplet 
  },
  other: { 
    labelAr: 'أعمال أخرى وتجهيزات', 
    color: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300', 
    border: 'border-slate-200 dark:border-slate-700/60',
    icon: Layers 
  },
};

// Status labels for open site tasks in the mandatory daily-report dropdown
export const SITE_TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'لم تبدأ',
  in_progress: 'قيد التنفيذ',
  pm_review: 'بانتظار اعتماد المدير',
  qc_pending: 'بانتظار استلام QC',
  approved: 'تم الاستلام',
  rejected: 'مرفوضة — تحتاج تعديل',
};

// Dropdown option text: "[متأخرة] Title — Zone (Status)"
export function formatSiteTaskOption(task: OpenSiteTaskOption): string {
  const statusLabel = SITE_TASK_STATUS_LABELS[task.status] || task.status;
  const zoneLabel = task.zone?.name_ar ? ` — ${task.zone.name_ar}` : '';
  const overdue = Boolean(
    task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
  );
  return `${overdue ? '[متأخرة] ' : ''}${task.title_ar}${zoneLabel} (${statusLabel})`;
}

export const DailyProgressForm: React.FC<DailyProgressFormProps> = ({
  projectId: initialProjectId,
  projects = [],
  preselectedSiteTaskId,
  initialReport,
  onSuccess,
  onCancel,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const isSiteEngineer = roles.includes('site_engineer') && !isAdmin;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preselected site task (from Site Workspace) — kept in state so a task
  // dropdown can bind to it and it flows into the report payload on submit.
  const [selectedSiteTaskId, setSelectedSiteTaskId] = useState<string | undefined>(
    preselectedSiteTaskId
  );
  const [siteTaskTouched, setSiteTaskTouched] = useState(false);

  // Editing existing report state
  const [editingReportId, setEditingReportId] = useState<string | null>(
    initialReport?.id || null
  );
  const [editingReportNo, setEditingReportNo] = useState<number | string | null>(
    initialReport?.report_no ?? null
  );
  const [existingReport, setExistingReport] = useState<DailyProgress | null>(null);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false);

  // Draft store
  const draftHeader = useDailyDraftStore((s) => s.header);
  const draftLines = useDailyDraftStore((s) => s.lines);
  const draftKey = useDailyDraftStore((s) => s.idempotencyKey);
  const updateHeaderDraft = useDailyDraftStore((s) => s.updateHeader);
  const addLineDraft = useDailyDraftStore((s) => s.addLine);
  const updateLineDraft = useDailyDraftStore((s) => s.updateLine);
  const removeLineDraft = useDailyDraftStore((s) => s.removeLine);
  const clearDraftStore = useDailyDraftStore((s) => s.clearDraft);
  const generateNewKey = useDailyDraftStore((s) => s.generateIdempotencyKey);

  // Global project synchronization
  const globalProjectId = useProjectStore((s) => s.activeProjectId);
  const setGlobalProjectId = useProjectStore((s) => s.setActiveProjectId);

  // Projects list: fallback fetch if parent didn't provide
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  useEffect(() => {
    if (projects.length > 0) {
      setLocalProjects(projects);
    } else {
      ProjectService.getProjects()
        .then((data) => setLocalProjects(data))
        .catch((err) => logger.warn('[DailyProgressForm] Failed to load projects', { detail: err }));
    }
  }, [projects]);

  const effectiveProjectId = initialProjectId || globalProjectId;

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    effectiveProjectId || (projects[0]?.id ?? '')
  );

  // Keep selectedProjectId strictly in sync with effectiveProjectId whenever it changes
  useEffect(() => {
    if (effectiveProjectId && effectiveProjectId !== selectedProjectId) {
      setSelectedProjectId(effectiveProjectId);
      updateHeaderDraft({ project_id: effectiveProjectId });
    }
  }, [effectiveProjectId]);

  // Set initial project once localProjects load if still unset
  useEffect(() => {
    if (!selectedProjectId && localProjects.length > 0) {
      const fallbackId = effectiveProjectId || localProjects[0].id;
      setSelectedProjectId(fallbackId);
      if (!globalProjectId) {
        setGlobalProjectId(fallbackId);
      }
    }
  }, [localProjects, selectedProjectId, effectiveProjectId, globalProjectId, setGlobalProjectId]);

  const selectedProjectObj = useMemo(() => {
    const targetId = selectedProjectId || effectiveProjectId;
    return localProjects.find((p) => p.id === targetId) || (localProjects.length > 0 ? localProjects[0] : undefined);
  }, [localProjects, selectedProjectId, effectiveProjectId]);

  useEffect(() => {
    if (selectedProjectObj && selectedProjectObj.id !== selectedProjectId) {
      setSelectedProjectId(selectedProjectObj.id);
      updateHeaderDraft({ project_id: selectedProjectObj.id });
    }
  }, [selectedProjectObj, selectedProjectId]);

  const [progressDate, setProgressDate] = useState<string>(
    draftHeader.progress_date || new Date().toISOString().slice(0, 10)
  );
  const [discipline, setDiscipline] = useState<DailyDiscipline>(
    draftHeader.discipline || 'civil'
  );
  const [weather, setWeather] = useState<string>(draftHeader.weather || 'مشمس وصافي');
  const [manpowerCount, setManpowerCount] = useState<number>(draftHeader.manpower_count ?? 0);
  const [equipmentSummary, setEquipmentSummary] = useState<string>(draftHeader.equipment_summary || '');
  const [notes, setNotes] = useState<string>(draftHeader.notes || '');

  // Line items state
  const [lines, setLines] = useState<DailyProgressLineDraft[]>(
    draftLines.length > 0
      ? draftLines
      : [
          {
            id: `line-${Date.now()}-0`,
            boq_item_id: '',
            qty_today: 0,
            zone: '',
            remarks: '',
            is_material_on_site: false,
            is_claimable_vo: false,
            inspection_status: 'not_required',
            wir_no: '',
            line_status: 'pending',
          },
        ]
  );

  // Photos State — upload_failed marks photos that never reached the
  // 'progress-photos' bucket (local preview only, excluded from DB attach).
  const [photos, setPhotos] = useState<{ storage_path: string; photo_url: string; caption: string; upload_failed?: boolean }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);

  // Reference Data
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [subcontractors, setSubcontractors] = useState<ProjectSubcontractor[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Site tasks (owner rule ب): mandatory dropdown of the project's open tasks
  const [siteTasks, setSiteTasks] = useState<OpenSiteTaskOption[]>([]);
  const [loadingSiteTasks, setLoadingSiteTasks] = useState(false);

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // Cumulative quantities per BOQ item for the selected task
  const [cumulativeQty, setCumulativeQty] = useState<Record<string, number>>({});

  // Track which lines are expanded to show secondary fields
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  // Item selector modal state
  const [activeLineIndexForPicker, setActiveLineIndexForPicker] = useState<number | null>(null);
  const [boqSearchTerm, setBoqSearchTerm] = useState('');
  const [boqDisciplineFilter, setBoqDisciplineFilter] = useState<string>('all');

  // Sync with initialReport prop if provided from outside (e.g. edit draft from log)
  useEffect(() => {
    if (initialReport) {
      setEditingReportId(initialReport.id);
      setEditingReportNo(initialReport.report_no ?? null);
      if (initialReport.project_id) {
        setSelectedProjectId(initialReport.project_id);
      }
      if (initialReport.progress_date) {
        setProgressDate(initialReport.progress_date);
      }
      if (initialReport.discipline) {
        setDiscipline(initialReport.discipline as DailyDiscipline);
      }
      setWeather(initialReport.weather || 'مشمس وصافي');
      setManpowerCount(initialReport.manpower_count || 0);
      setEquipmentSummary(initialReport.equipment_summary || '');
      setNotes(initialReport.notes || '');
      if (initialReport.site_task_id) {
        setSelectedSiteTaskId(initialReport.site_task_id);
      }
      if (initialReport.lines && initialReport.lines.length > 0) {
        setLines(
          initialReport.lines.map((l, idx: number) => ({
            ...l,
            id: l.id || `line-${Date.now()}-${idx}`,
          }))
        );
      }
    }
  }, [initialReport]);

  // Real-time detection: check if a report already exists for (selectedProjectId, progressDate, discipline)
  useEffect(() => {
    if (!selectedProjectId || !progressDate || !discipline) {
      setExistingReport(null);
      return;
    }

    // If currently editing this report, do not flag it as a collision
    if (editingReportId) {
      setExistingReport(null);
      return;
    }

    let isMounted = true;
    setCheckingExisting(true);
    DailyProgressService.checkExistingReport(selectedProjectId, progressDate, discipline)
      .then((existing) => {
        if (isMounted) {
          setExistingReport(existing);
        }
      })
      .catch((err) => logger.warn('[DailyProgressForm] Failed checking existing report', { detail: err }))
      .finally(() => {
        if (isMounted) setCheckingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId, progressDate, discipline, editingReportId]);

  const handleLoadExistingDraft = (rep: DailyProgress) => {
    setEditingReportId(rep.id);
    setEditingReportNo(rep.report_no ?? null);
    setProgressDate(rep.progress_date);
    setDiscipline(rep.discipline as DailyDiscipline);
    setWeather(rep.weather || 'مشمس وصافي');
    setManpowerCount(rep.manpower_count || 0);
    setEquipmentSummary(rep.equipment_summary || '');
    setNotes(rep.notes || '');
    if (rep.site_task_id) {
      setSelectedSiteTaskId(rep.site_task_id);
    }
    if (rep.lines && rep.lines.length > 0) {
      setLines(
        rep.lines.map((l, idx: number) => ({
          ...l,
          id: l.id || `line-${Date.now()}-${idx}`,
        }))
      );
    }
    setExistingReport(null);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditingReportNo(null);
    setExistingReport(null);
    setErrorMsg(null);
    setWeather('مشمس وصافي');
    setManpowerCount(0);
    setEquipmentSummary('');
    setNotes('');
    setLines([
      {
        id: `line-${Date.now()}-0`,
        boq_item_id: '',
        qty_today: 0,
        zone: '',
        remarks: '',
        is_material_on_site: false,
        is_claimable_vo: false,
        inspection_status: 'not_required',
        wir_no: '',
        line_status: 'pending',
      },
    ]);
  };

  // Load BOQ items and subcontractors for the selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingRefs(true);
    Promise.all([
      BoqService.getBoqItems(selectedProjectId, true, { userRoles: roles, isAdmin }),
      ProjectTabsService.getSubcontractors(selectedProjectId),
    ])
      .then(([items, subs]) => {
        setBoqItems(items);
        setSubcontractors(subs);
      })
      .catch((err) => {
        logger.error('Error fetching project reference data', { detail: err });
      })
      .finally(() => setLoadingRefs(false));
  }, [selectedProjectId, roles, isAdmin]);

  // Load the project's OPEN site tasks for the mandatory dropdown (rule ب)
  useEffect(() => {
    if (!selectedProjectId) return;
    let alive = true;
    setLoadingSiteTasks(true);
    DailyProgressService.getOpenSiteTasks(selectedProjectId)
      .then((tasks) => {
        if (!alive) return;
        setSiteTasks(tasks);
        // Drop a stale selection that is not among this project's open tasks
        setSelectedSiteTaskId((prev) =>
          prev && tasks.some((t) => t.id === prev) ? prev : undefined
        );
      })
      .catch((err) => logger.error('Error fetching open site tasks', { detail: err }))
      .finally(() => {
        if (alive) setLoadingSiteTasks(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedProjectId]);

  // Adopt an updated preselection coming from the Site Workspace page
  useEffect(() => {
    if (preselectedSiteTaskId) {
      setSelectedSiteTaskId(preselectedSiteTaskId);
    }
  }, [preselectedSiteTaskId]);

  // Fetch cumulative quantities for the selected task
  useEffect(() => {
    if (!selectedSiteTaskId) {
      setCumulativeQty({});
      return;
    }
    let alive = true;
    DailyProgressService.getCumulativeQtyByTask(selectedSiteTaskId)
      .then((map) => { if (alive) setCumulativeQty(map); })
      .catch(() => { if (alive) setCumulativeQty({}); });
    return () => { alive = false; };
  }, [selectedSiteTaskId]);

  // Auto-load today's existing draft for this task (so engineer can continue editing)
  useEffect(() => {
    if (!selectedProjectId || !selectedSiteTaskId || editingReportId || initialReport) return;
    let alive = true;
    DailyProgressService.getExistingDraftForTaskToday(selectedProjectId, selectedSiteTaskId)
      .then((draft) => {
        if (!alive || !draft) return;
        handleLoadExistingDraft(draft);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [selectedProjectId, selectedSiteTaskId]);

  // Sync with draft store on initial mount
  useEffect(() => {
    if (draftLines.length > 0 && draftHeader.project_id) {
      setShowDraftBanner(true);
    }
  }, [draftLines, draftHeader]);

  // Save changes to draft store whenever header or lines change
  useEffect(() => {
    if (selectedProjectId) {
      updateHeaderDraft({
        project_id: selectedProjectId,
        progress_date: progressDate,
        discipline,
        weather,
        manpower_count: manpowerCount,
        equipment_summary: equipmentSummary,
        notes,
        idempotency_key: draftKey,
      });
    }
  }, [
    selectedProjectId,
    progressDate,
    discipline,
    weather,
    manpowerCount,
    equipmentSummary,
    notes,
    draftKey,
    updateHeaderDraft,
  ]);

  // Handle restoring draft
  const handleRestoreDraft = () => {
    if (draftHeader.project_id) setSelectedProjectId(draftHeader.project_id);
    if (draftHeader.progress_date) setProgressDate(draftHeader.progress_date);
    if (draftHeader.discipline) setDiscipline(draftHeader.discipline);
    if (draftHeader.weather) setWeather(draftHeader.weather);
    if (draftHeader.manpower_count !== undefined) setManpowerCount(draftHeader.manpower_count);
    if (draftHeader.equipment_summary) setEquipmentSummary(draftHeader.equipment_summary);
    if (draftHeader.notes) setNotes(draftHeader.notes);
    if (draftLines.length > 0) setLines(draftLines);
    setShowDraftBanner(false);
  };

  // Handle clearing draft
  const handleClearDraft = () => {
    clearDraftStore();
    setShowDraftBanner(false);
    setLines([
      {
        id: `line-${Date.now()}-0`,
        boq_item_id: '',
        qty_today: 0,
        zone: '',
        remarks: '',
        is_material_on_site: false,
        is_claimable_vo: false,
        inspection_status: 'not_required',
        wir_no: '',
        line_status: 'pending',
      },
    ]);
  };

  // Add line item
  const handleAddLine = () => {
    const newLine: Partial<DailyProgressLine> = {
      id: `line-${Date.now()}-${lines.length}`,
      boq_item_id: '',
      qty_today: 0,
      zone: '',
      remarks: '',
      is_material_on_site: false,
      is_claimable_vo: false,
      inspection_status: 'not_required',
      wir_no: '',
      line_status: 'pending',
    };
    const updated = [...lines, newLine];
    setLines(updated);
    addLineDraft(newLine);
  };

  // Update line item
  const handleUpdateLine = (index: number, patch: DailyProgressLineDraft) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], ...patch };
    setLines(updated);
    updateLineDraft(index, patch);
  };

  // Remove line item
  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      // Clear instead of removing last row
      handleUpdateLine(0, {
        boq_item_id: '',
        qty_today: 0,
        zone: '',
        remarks: '',
        is_material_on_site: false,
        is_claimable_vo: false,
        wir_no: '',
        supplied_qty: undefined,
      });
      return;
    }
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
    removeLineDraft(index);
  };

  // Filtered BOQ items for modal picker
  const filteredBoqItems = useMemo(() => {
    return boqItems.filter((item) => {
      const q = boqSearchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.item_code.toLowerCase().includes(q) ||
        item.description_ar.toLowerCase().includes(q) ||
        (item.description_en && item.description_en.toLowerCase().includes(q)) ||
        (item.cost_code?.code && item.cost_code.code.toLowerCase().includes(q));

      const matchDiscipline =
        boqDisciplineFilter === 'all' ||
        item.cost_code?.category === boqDisciplineFilter;

      return matchSearch && matchDiscipline;
    });
  }, [boqItems, boqSearchTerm, boqDisciplineFilter]);

  // Select BOQ item for active line
  const handleSelectBoqItem = (item: BoqItem) => {
    if (activeLineIndexForPicker !== null) {
      handleUpdateLine(activeLineIndexForPicker, {
        boq_item_id: item.id,
        boq_item: item,
      });
      setActiveLineIndexForPicker(null);
      setBoqSearchTerm('');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const validation = validateSafeUploadFile(files[i]);
      if (!validation.valid) {
        setErrorMsg(validation.error || 'نوع الملف أو حجمه غير مسموح به للرفع');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setErrorMsg(null);
    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
        const fileExt = rawExt || 'jpg';
        const fileName = `progress_${selectedProjectId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${selectedProjectId}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('progress-photos')
          .upload(filePath, file);

        if (uploadErr) {
          logger.warn('Photo upload to bucket failed', { detail: uploadErr });
          setErrorMsg('فشل رفع الصورة إلى الخادم، لم يتم إرفاق الصورة');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(filePath);
        const photoUrl = publicUrlData.publicUrl;
        if (!photoUrl) {
          setErrorMsg('تعذر الحصول على رابط الصورة بعد الرفع');
          return;
        }

        setPhotos((prev) => [
          ...prev,
          {
            storage_path: filePath,
            photo_url: photoUrl,
            caption: '',
            upload_failed: false,
          },
        ]);
      }
    } catch (err: unknown) {
      logger.warn('Photo upload warning', { detail: err });
      setErrorMsg('حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], caption };
      return updated;
    });
  };

  // Validation
  const validateForm = (): boolean => {
    if (!selectedProjectId) {
      setErrorMsg('يرجى اختيار المشروع');
      return false;
    }
    if (!progressDate) {
      setErrorMsg('يرجى تحديد تاريخ اليومية');
      return false;
    }
    if (!selectedSiteTaskId) {
      setSiteTaskTouched(true);
      setErrorMsg('يرجى اختيار المهمة المرتبطة بالتقرير (إجباري)');
      return false;
    }

    const validLines = lines.filter((l) => l.boq_item_id && Number(l.qty_today) > 0);
    if (validLines.length === 0) {
      setErrorMsg('يرجى إضافة بند واحد على الأقل مع كمية منفذة أكبر من الصفر');
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  // Submit Handler
  const handleSubmit = async (submitStatus: 'draft' | 'submitted') => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const validLines = lines
        .filter((l) => l.boq_item_id && Number(l.qty_today) > 0)
        .map((l) => ({
          boq_item_id: l.boq_item_id!,
          qty_today: Number(l.qty_today),
          zone: l.zone || undefined,
          remarks: l.remarks || undefined,
          is_material_on_site: Boolean(l.is_material_on_site),
          is_claimable_vo: Boolean(l.is_claimable_vo),
          wir_no: l.wir_no || undefined,
          inspection_status: (l.inspection_status as InspectionStatus) || 'not_required',
          supplied_qty: l.supplied_qty !== undefined ? Number(l.supplied_qty) : undefined,
          subcontractor_id: l.subcontractor_id || undefined,
          line_status: 'pending' as const,
        }));

      const headerPayload: Partial<DailyProgress> = {
        project_id: selectedProjectId,
        progress_date: progressDate,
        discipline,
        weather,
        manpower_count: Number(manpowerCount) || 0,
        equipment_summary: equipmentSummary.trim() || undefined,
        notes: notes.trim() || undefined,
        entered_by: user?.id || 'site_engineer',
        entered_by_name: user?.user_metadata?.full_name || 'مهندس الموقع',
        status: submitStatus,
        idempotency_key: draftKey || generateNewKey(),
        site_task_id: selectedSiteTaskId,
      };

      let savedReport: DailyProgress | null = null;

      if (editingReportId) {
        savedReport = await DailyProgressService.saveExistingDailyReport(
          editingReportId,
          {
            weather,
            manpower_count: Number(manpowerCount) || 0,
            equipment_summary: equipmentSummary.trim() || undefined,
            notes: notes.trim() || undefined,
            site_task_id: selectedSiteTaskId,
            entered_by_name: user?.user_metadata?.full_name || 'مهندس الموقع',
          },
          validLines
        );

        if (submitStatus === 'submitted' && savedReport) {
          const ok = await DailyProgressService.submitDailyReport(
            editingReportId,
            selectedProjectId
          );
          if (!ok) {
            throw new Error('فشل تقديم التقرير اليومي للاعتماد بعد حفظ التعديلات');
          }
        }
      } else {
        const created = await DailyProgressService.createDailyReport(
          headerPayload,
          validLines
        );
        savedReport = created;
      }

      if (!savedReport) {
        throw new Error('فشل تسجيل التقرير اليومي، يرجى إعادة المحاولة');
      }

      // Upload photos if any
      const uploadablePhotos = photos.filter((p) => !p.upload_failed);
      if (uploadablePhotos.length > 0 && savedReport.id) {
        for (const p of uploadablePhotos) {
          await DailyProgressService.addPhotoAttachment({
            daily_progress_id: savedReport.id,
            storage_path: p.storage_path,
            photo_url: p.photo_url,
            caption: p.caption,
            uploaded_by: user?.id,
          });
        }
      }

      // ── Create QC inspection requests for flagged lines ──
      const qcLines = lines.filter((l) => l.needs_qc_inspection && l.boq_item_id);
      let qcCreated = 0;
      let qcFailed = 0;

      if (qcLines.length > 0 && selectedSiteTaskId && submitStatus === 'submitted') {
        for (const qcLine of qcLines) {
          try {
            await TaskOntologyService.createInspectionRequest({
              task_id: selectedSiteTaskId,
              project_id: selectedProjectId,
              request_no: '',
              inspection_type: qcLine.qc_inspection_type || 'WIR',
              required_at: qcLine.qc_required_date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              status: 'pending',
              reason: qcLine.qc_notes || undefined,
              created_by: user?.id,
            });
            qcCreated++;
          } catch (qcErr: unknown) {
            qcFailed++;
            logger.warn('Failed to create QC inspection request', {
              detail: qcErr,
              boq_item_id: qcLine.boq_item_id,
            });
          }
        }
      }

      const qcMsg = qcCreated > 0 ? ` — وتم إنشاء ${qcCreated} طلب فحص QC` : '';
      const qcWarnMsg = qcFailed > 0 ? ` (تنبيه: فشل إنشاء ${qcFailed} طلب فحص)` : '';

      setSuccessMsg(
        submitStatus === 'submitted'
          ? `تم تقديم التقرير اليومي بنجاح وهو قيد مراجعة مدير المشروع${qcMsg}${qcWarnMsg}`
          : (editingReportId ? 'تم حفظ تعديلات مسودة التقرير اليومي بنجاح' : 'تم حفظ مسودة التقرير اليومي بنجاح')
      );

      // Emit real-time telemetry to ATSMATRIX visualizer
      emitAtsmatrixEvent({
        agent_id: user?.email || 'site_engineer',
        action: submitStatus === 'submitted' ? 'SYNC' : 'MATCH',
        cluster: submitStatus === 'submitted' ? 'SYNTHESIS_BROKER' : 'VERIFICATION_CORE',
        message: `Daily Report #${savedReport?.report_no || ''} ${submitStatus === 'submitted' ? 'submitted for PM approval' : 'saved as draft'} (${progressDate})`,
        payload: {
          project_id: selectedProjectId,
          discipline,
          lines_count: validLines.length,
          qc_created: qcCreated,
        },
      });

      // Clear draft after successful creation
      clearDraftStore();
      generateNewKey();
      setEditingReportId(null);
      setEditingReportNo(null);
      setExistingReport(null);

      // ── Auto-calculate task progress (weighted by cost) ──
      if (selectedSiteTaskId && submitStatus === 'submitted') {
        try {
          const newProgress = await DailyProgressService.calculateTaskProgress(selectedSiteTaskId);
          logger.info('Task progress auto-calculated', { siteTaskId: selectedSiteTaskId, progress: newProgress });

          // Send notification to planning engineer
          // NOTE: In production, recipient should be fetched from project stakeholders.
          // For now we just create a notification record that the planning dashboard queries.
          await NotificationService.createNotification({
            project_id: selectedProjectId,
            event_type: 'progress_submitted',
            entity_type: 'daily_progress',
            entity_id: savedReport?.id || '',
            title_ar: `تم رفع progress جديد: ${newProgress.toFixed(1)}%`,
            body_ar: `مهندس ${user?.user_metadata?.full_name || 'الموقع'} رفع تقرير إنجاز — التراكمي ${newProgress.toFixed(1)}%`,
            link_url: '/planning/dashboard',
            recipient_user_id: user?.id || '', // Will be routed to planning engineer via DB trigger or dashboard query
          });
        } catch (calcErr) {
          logger.warn('Auto-calculate progress failed (non-fatal)', { detail: calcErr });
        }
      }

      if (onSuccess) {
        onSuccess(savedReport);
      }
    } catch (err: unknown) {
      logger.error('Submission error', { detail: err });
      const rawMsg: string = (err as { message?: string } | null)?.message || '';
      if (rawMsg.includes('SITE_TASK_REQUIRED')) {
        setErrorMsg('لا يمكن حفظ التقرير اليومي بدون ربطه بمهمة موقع مفتوحة');
      } else if (
        rawMsg.includes('DUPLICATE_REPORT') ||
        rawMsg.includes('pm_daily_progress_project_id_progress_date_discipline_key') ||
        rawMsg.includes('23505') ||
        rawMsg.includes('duplicate key')
      ) {
        setErrorMsg(
          'يوجد تقرير مسجل بالفعل لهذا المشروع في هذا التاريخ ونفس التخصص. لا يمكن تسجيل أكثر من تقرير لنفس التخصص في اليوم الواحد. يمكنك استكمال وتعديل المسودة المسجلة أو تغيير التاريخ/التخصص.'
        );
      } else {
        setErrorMsg(rawMsg || 'حدث خطأ أثناء حفظ التقرير اليومي');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Restore Draft Banner */}
      {showDraftBanner && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-xs">
              <span className="font-bold">توجد مسودة محفوظة محلياً: </span>
              <span>
                تاريخ {draftHeader.progress_date || 'غير محدد'} ({draftLines.length} بنود مدخلة)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
            >{isAr ? 'استرجاع المسودة' : 'Restore draft'}</button>
            <button
              onClick={handleClearDraft}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
            >{isAr ? 'تجاهل' : 'Dismiss'}</button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Mode Banner */}
      {editingReportId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-xs">
              <span className="font-bold">وضع تعديل مسودة التقرير اليومي: </span>
              <span>
                يومية {editingReportNo ? `#${editingReportNo}` : ''} بتاريخ {progressDate} ({DISCIPLINE_LABELS[discipline]?.labelAr || discipline})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition shrink-0"
          >
            {isAr ? 'إلغاء التعديل وبدء تقرير جديد' : 'Cancel edit'}
          </button>
        </div>
      )}

      {/* Existing Report Detected Banner */}
      {existingReport && !editingReportId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-xs">
              <div className="font-bold">
                {existingReport.status === 'draft'
                  ? 'توجد مسودة مسجلة مسبقاً لهذا المشروع بنفس التاريخ والتخصص'
                  : 'يوجد تقرير مسجل مسبقاً لهذا المشروع بنفس التاريخ والتخصص'}
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                يومية #{existingReport.report_no} ({DISCIPLINE_LABELS[existingReport.discipline as DailyDiscipline]?.labelAr || existingReport.discipline}) — الحالة: {existingReport.status === 'draft' ? 'مسودة' : existingReport.status === 'submitted' ? 'قيد المراجعة' : existingReport.status === 'approved' ? 'معتمد' : existingReport.status}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {existingReport.status === 'draft' && (
              <button
                type="button"
                onClick={() => handleLoadExistingDraft(existingReport)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
              >
                {isAr ? 'استكمال وتعديل المسودة' : 'Edit this draft'}
              </button>
            )}
            <a
              href="/planning/daily-progress"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-1"
            >
              {isAr ? 'عرض في سجل اليوميات' : 'View in log'}
            </a>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Section 1: Header Info */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>بيانات اليومية الميدانية (Site Daily Header)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل سريع وسهل خلال أقل من 60 ثانية لمتابعة الأعمال المنجزة
              </p>
            </div>

            {/* Offline sync indicator badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>حفظ محلي فوري</span>
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                title="مسح الحقول وبدء نموذج جديد"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Project Display — Unified with top selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'المشروع *' : 'Project *'}</span>
              </label>
              {selectedProjectObj ? (
                <div className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white font-bold text-xs select-none shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
                      {selectedProjectObj.project_code}
                    </span>
                    <span className="truncate">
                      {selectedProjectObj.project_name || selectedProjectObj.project_name_ar}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium shrink-0 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                    {isAr ? 'المشروع المختار' : 'Active Project'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-400 font-bold text-xs select-none shadow-sm">
                  <span className="animate-pulse">{isAr ? 'جاري مزامنة المشروع المختار...' : 'Syncing active project...'}</span>
                </div>
              )}
            </div>

            {/* Date Select */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'تاريخ التقرير *' : 'Report date *'}</span>
              </label>
              <input
                type="date"
                value={progressDate}
                onChange={(e) => setProgressDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Discipline Select */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'التخصص الهندسي *' : 'Discipline *'}</span>
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DailyDiscipline)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="civil">أعمال مدنية وإنشائية</option>
                <option value="finishing">أعمال تشطيبات</option>
                <option value="mep">أعمال كهروميكانيكية (MEP)</option>
                <option value="landscape">أعمال لاندسكيب وموقع عام</option>
                <option value="water_features">حمامات سباحة وبحيرات</option>
                <option value="other">أعمال أخرى وتجهيزات</option>
              </select>
            </div>
          </div>

          {/* Mandatory Linked Site Task (owner rule ب) */}
          <div className="text-xs pt-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'المهمة المرتبطة (إجباري) *' : 'Linked task (mandatory) *'}</span>
            </label>
            <select
              value={selectedSiteTaskId || ''}
              onChange={(e) => {
                setSelectedSiteTaskId(e.target.value || undefined);
                if (e.target.value) setSiteTaskTouched(false);
              }}
              disabled={loadingSiteTasks}
              className={`w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border ${siteTaskTouched && !selectedSiteTaskId ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <option value="">— اختر مهمة —</option>
              {siteTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {formatSiteTaskOption(t)}
                </option>
              ))}
            </select>
            {loadingSiteTasks ? (
              <p className="mt-1 text-[11px] text-slate-400">
                جاري تحميل مهام الموقع المفتوحة...
              </p>
            ) : siteTaskTouched && !selectedSiteTaskId ? (
              <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                يرجى اختيار المهمة المرتبطة قبل الحفظ أو التقديم
              </p>
            ) : siteTasks.length === 0 ? (
              <p className="mt-1 text-[11px] text-slate-400">
                لا توجد مهام موقع مفتوحة مرتبطة بهذا المشروع حالياً
              </p>
            ) : null}
          </div>

          {/* ── Collapsible: Weather, Manpower, Equipment ── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showExtras ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>📋 {isAr ? 'تفاصيل إضافية (طقس • عمالة • معدات)' : 'Extra details (weather • manpower • equipment)'}</span>
            </button>

            {showExtras && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-3 animate-in fade-in duration-200">
                {/* Weather */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <CloudSun className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'حالة الطقس' : 'Weather'}</span>
                  </label>
                  <input
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder={isAr ? 'مثال: مشمس، ممطر...' : 'e.g. sunny, rainy...'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Manpower */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'إجمالي العمالة (فرد)' : 'Total manpower'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manpowerCount}
                    onChange={(e) => setManpowerCount(parseInt(e.target.value) || 0)}
                    placeholder={isAr ? 'عدد العمال...' : 'Workers count...'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isAr ? 'المعدات بالموقع' : 'Equipment'}</span>
                  </label>
                  <input
                    type="text"
                    value={equipmentSummary}
                    onChange={(e) => setEquipmentSummary(e.target.value)}
                    placeholder={isAr ? 'مثال: 2 حفار، 1 لودر...' : 'e.g. 2 excavators, 1 loader...'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Line Items Table / Editor */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>بنود الأعمال المنفذة اليوم ({lines.length} بند)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر البند من جدول الكميات وسجل الكمية المنفذة والمنطقة ومقاول الباطن
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة بند عمل' : 'Add work line'}</span>
            </button>
          </div>

          {/* Line items list */}
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const selectedBoq = boqItems.find((b) => b.id === line.boq_item_id) || line.boq_item;
              const isExpanded = expandedLines.has(idx);
              const toggleExpand = () => {
                setExpandedLines((prev) => {
                  const next = new Set(prev);
                  if (next.has(idx)) next.delete(idx);
                  else next.add(idx);
                  return next;
                });
              };
              return (
                <div
                  key={line.id || idx}
                  className={`rounded-2xl border transition ${isExpanded ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 hover:border-emerald-200 dark:hover:border-emerald-950/60'}`}
                >
                  {/* ── Compact Row: BOQ + Qty + Zone + Actions ── */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Line # */}
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">{idx + 1}</span>

                    {/* BOQ Selector */}
                    <button
                      type="button"
                      onClick={() => setActiveLineIndexForPicker(idx)}
                      className="flex-1 min-w-0 text-start group"
                    >
                      {selectedBoq ? (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded shrink-0">
                            {selectedBoq.item_code}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {selectedBoq.description_ar}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">({selectedBoq.unit})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1">
                          <Search className="w-3.5 h-3.5" />
                          اختر البند...
                        </span>
                      )}
                    </button>

                    {/* Qty Today / Pct Toggle (inline) */}
                    <div className="w-28 shrink-0 relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={line.qty_today || ''}
                        onChange={(e) => {
                          const newQty = parseFloat(e.target.value) || 0;
                          // Validate: cumulative + new must be >= current cumulative (no decrease)
                          const prevCumulative = line.boq_item_id ? Number(cumulativeQty[line.boq_item_id]) || 0 : 0;
                          const contractQty = selectedBoq?.contract_qty ? Number(selectedBoq.contract_qty) : 0;
                          if (newQty < 0) return;
                          // Auto-calc pct if contract_qty known
                          const updates: Partial<DailyProgressLineDraft> = { qty_today: newQty };
                          if (contractQty > 0) {
                            updates.pct_today = Math.round(((prevCumulative + newQty) / contractQty) * 10000) / 100;
                          }
                          handleUpdateLine(idx, updates);
                        }}
                        placeholder="الكمية"
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs text-center focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    {/* Pct input (alternative entry) */}
                    <div className="w-20 shrink-0 hidden sm:block relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={(() => {
                          const contractQty = selectedBoq?.contract_qty ? Number(selectedBoq.contract_qty) : 0;
                          const prevCumulative = line.boq_item_id ? Number(cumulativeQty[line.boq_item_id]) || 0 : 0;
                          if (contractQty > 0 && Number(line.qty_today) > 0) {
                            return Math.round(((prevCumulative + Number(line.qty_today)) / contractQty) * 10000) / 100;
                          }
                          return line.pct_today || '';
                        })()}
                        onChange={(e) => {
                          const pctValue = parseFloat(e.target.value) || 0;
                          const contractQty = selectedBoq?.contract_qty ? Number(selectedBoq.contract_qty) : 0;
                          const prevCumulative = line.boq_item_id ? Number(cumulativeQty[line.boq_item_id]) || 0 : 0;
                          if (pctValue < 0 || pctValue > 100) return;
                          // Convert pct to qty
                          const updates: Partial<DailyProgressLineDraft> = { pct_today: pctValue };
                          if (contractQty > 0) {
                            const totalQtyNeeded = (pctValue / 100) * contractQty;
                            const qtyToday = Math.max(totalQtyNeeded - prevCumulative, 0);
                            updates.qty_today = Math.round(qtyToday * 1000) / 1000;
                          }
                          handleUpdateLine(idx, updates);
                        }}
                        placeholder="%"
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white font-mono font-bold text-xs text-center focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-amber-500 font-bold">%</span>
                    </div>

                    {/* Zone (inline) */}
                    <div className="w-24 shrink-0 hidden sm:block">
                      <input
                        type="text"
                        value={line.zone || ''}
                        onChange={(e) => handleUpdateLine(idx, { zone: e.target.value })}
                        placeholder="المنطقة"
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs text-center focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={toggleExpand}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/30 transition shrink-0"
                      title={isExpanded ? 'تقليص' : 'المزيد'}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/30 transition shrink-0"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cumulative badge (always visible if data exists) */}
                  {line.boq_item_id && cumulativeQty[line.boq_item_id] != null && (
                    <div className="px-4 pb-2 -mt-1 flex items-center gap-3 text-[10px]">
                      <span className="w-5 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">
                        التراكمي: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{Number(cumulativeQty[line.boq_item_id]).toLocaleString()}</span>
                      </span>
                      {Number(line.qty_today) > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          → <span className="font-mono">{(Number(cumulativeQty[line.boq_item_id]) + Number(line.qty_today)).toLocaleString()}</span>
                          {selectedBoq?.contract_qty && Number(selectedBoq.contract_qty) > 0 && (
                            <span className="ms-1 text-slate-400 dark:text-slate-500 font-normal">
                              ({Math.round(((Number(cumulativeQty[line.boq_item_id]) + Number(line.qty_today)) / Number(selectedBoq.contract_qty)) * 100)}%)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Expanded: Secondary Fields ── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Zone on mobile (hidden on desktop since it's inline above) */}
                      <div className="sm:hidden">
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">المنطقة / Zone</label>
                        <input
                          type="text"
                          value={line.zone || ''}
                          onChange={(e) => handleUpdateLine(idx, { zone: e.target.value })}
                          placeholder="مثال: Zone A, مبنى 1..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {/* Subcontractor */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مقاول الباطن</label>
                          <select
                            value={line.subcontractor_id || ''}
                            onChange={(e) =>
                              handleUpdateLine(idx, { subcontractor_id: e.target.value || undefined })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="">-- تنفيذ ذاتي --</option>
                            {subcontractors.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.company_name} ({sub.specialization || 'مقاول'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* WIR No */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم WIR</label>
                          <input
                            type="text"
                            value={line.wir_no || ''}
                            onChange={(e) => handleUpdateLine(idx, { wir_no: e.target.value })}
                            placeholder="WIR-CV-042"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        {/* Inspection Status */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">حالة الاستلام</label>
                          <select
                            value={line.inspection_status || 'not_required'}
                            onChange={(e) =>
                              handleUpdateLine(idx, {
                                inspection_status: e.target.value as InspectionStatus,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="not_required">غير مطلوب</option>
                            <option value="submitted">تم التقديم</option>
                            <option value="lab_pending">انتظار معمل</option>
                            <option value="approved">معتمد</option>
                            <option value="rejected">مرفوض</option>
                          </select>
                        </div>

                        {/* Supplied Qty */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الكمية الموردة</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={line.supplied_qty !== undefined ? line.supplied_qty : ''}
                            onChange={(e) =>
                              handleUpdateLine(idx, {
                                supplied_qty: e.target.value ? parseFloat(e.target.value) : undefined,
                              })
                            }
                            placeholder="لحساب الهالك..."
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Checkboxes & Remarks */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                          <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(line.is_material_on_site)}
                              onChange={(e) =>
                                handleUpdateLine(idx, { is_material_on_site: e.target.checked })
                              }
                              className="w-4 h-4 rounded text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500"
                            />
                            <span>MOS تشوين</span>
                          </label>

                          <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-amber-700 dark:text-amber-400">
                            <input
                              type="checkbox"
                              checked={Boolean(line.is_claimable_vo)}
                              onChange={(e) =>
                                handleUpdateLine(idx, { is_claimable_vo: e.target.checked })
                              }
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>VO مطالبة</span>
                          </label>
                        </div>

                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            value={line.remarks || ''}
                            onChange={(e) => handleUpdateLine(idx, { remarks: e.target.value })}
                            placeholder="ملاحظات..."
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                          />
                        </div>

                      {/* QC Inspection Request */}
                      <div className="pt-2 border-t border-dashed border-slate-200/60 dark:border-slate-700/60">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-cyan-700 dark:text-cyan-400">
                          <input
                            type="checkbox"
                            checked={Boolean(line.needs_qc_inspection)}
                            onChange={(e) =>
                              handleUpdateLine(idx, {
                                needs_qc_inspection: e.target.checked,
                                ...(e.target.checked && !line.qc_inspection_type
                                  ? {
                                      qc_inspection_type: 'WIR',
                                      qc_required_date:
                                        line.qc_required_date ||
                                        new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                                    }
                                  : {}),
                              })
                            }
                            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                          />
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>طلب معاينة QC</span>
                        </label>

                        {Boolean(line.needs_qc_inspection) && (
                          <div className="mt-2 p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              سيتم إنشاء طلب فحص QC تلقائياً عند تقديم التقرير
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الفحص *</label>
                                <select
                                  value={line.qc_inspection_type || 'WIR'}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, { qc_inspection_type: e.target.value as InspectionType })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
                                >
                                  <option value="WIR">فحص أعمال</option>
                                  <option value="MIR">فحص مواد</option>
                                  <option value="NCR">عدم مطابقة</option>
                                  <option value="pre_pour">ما قبل الصب</option>
                                  <option value="survey">مساحي</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المنطقة</label>
                                <input type="text" value={line.zone || ''} readOnly className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" placeholder="(من البند)" />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ الفحص *</label>
                                <input
                                  type="date"
                                  value={line.qc_required_date || ''}
                                  min={new Date().toISOString().slice(0, 10)}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, { qc_required_date: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                                <input
                                  type="text"
                                  value={line.qc_notes || ''}
                                  onChange={(e) =>
                                    handleUpdateLine(idx, { qc_notes: e.target.value })
                                  }
                                  placeholder="وصف مختصر..."
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Photo Attachments */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>الصور الميدانية المرفقة ({photos.length} صورة)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                التقط صوراً مباشرة من كاميرا الهاتف أو ارفع صور التوثيق اليومي
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                id="camera-file-input"
              />
              <label
                htmlFor="camera-file-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingPhoto ? 'جاري رفع الصور...' : 'التقاط / رفع صور'}</span>
              </label>
            </div>
          </div>

          {photos.some((p) => p.upload_failed) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? `بعض الصور (${photos.filter((p) => p.upload_failed).length}) فشل رفعها لسحابة المشروع — تظهر كمعاينة محلية فقط ولن تُحفظ مع التقرير. أعد المحاولة أو تحقق من الاتصال.`
                  : `${photos.filter((p) => p.upload_failed).length} photo(s) failed to upload to the project bucket — shown as local preview only and will NOT be saved with the report. Retry or check connectivity.`}
              </span>
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
              {photos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  className="p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm space-y-2 relative group"
                >
                  <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption ? `${photo.caption} - صورة توثيق موقع ${pIdx + 1}` : `صورة توثيق موقع رقم ${pIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoIndex(pIdx)}
                      className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                      aria-label={isAr ? `تكبير ومعاينة الصورة رقم ${pIdx + 1}` : `Enlarge and view photo ${pIdx + 1}`}
                    >
                      <span className="p-2 rounded-xl bg-slate-900/70 text-white shadow-lg backdrop-blur-xs">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(pIdx);
                      }}
                      className="absolute top-2 end-2 p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition shadow z-10"
                      aria-label={isAr ? `حذف الصورة ${pIdx + 1}` : `Delete photo ${pIdx + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handleUpdatePhotoCaption(pIdx, e.target.value)}
                    placeholder={isAr ? 'وصف الصورة (مثال: صب اللبشة)...' : 'Photo caption (e.g. slab pouring)...'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: General Notes */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <label className="block font-bold text-slate-700 dark:text-slate-300">
            ملاحظات عامة حول سير الأعمال
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات عامة حول تقدم الأعمال، زيارات الاستشاري، تعليمات الموقع..."
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Footer Actions Bar */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>مفتاح عدم التكرار (Idempotency):</span>
            <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
              {draftKey?.slice(0, 14)}...
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >{isAr ? 'إلغاء' : 'Cancel'}</button>
            )}

            <button
              type="button"
              disabled={isSubmitting || !selectedSiteTaskId || (Boolean(existingReport) && !editingReportId && existingReport?.status !== 'draft')}
              onClick={() => handleSubmit('draft')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>
                {editingReportId
                  ? (isAr ? 'حفظ تعديلات المسودة' : 'Save draft changes')
                  : (isAr ? 'حفظ كمسودة' : 'Save as draft')}
              </span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !selectedSiteTaskId || (Boolean(existingReport) && !editingReportId && existingReport?.status !== 'draft')}
              onClick={() => handleSubmit('submitted')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Layers className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {editingReportId
                  ? (isAr ? 'تقديم المسودة للاعتماد' : 'Submit draft')
                  : (isAr ? 'تقديم للاعتماد' : 'Submit for approval')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* BOQ Cascading Lookup Modal */}
      {activeLineIndexForPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>البحث واختيار بند جدول الكميات (BOQ Item Lookup)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تصفية متسلسلة حسب التخصص وكود البند والوصف
                </p>
              </div>
              <button
                onClick={() => setActiveLineIndexForPicker(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'ابحث بكود البند أو الوصف بالعربية...' : 'Search by item code or Arabic description...'}
                  value={boqSearchTerm}
                  onChange={(e) => setBoqSearchTerm(e.target.value)}
                  className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={boqDisciplineFilter}
                onChange={(e) => setBoqDisciplineFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">كافة التصنيفات والتخصصات</option>
                <option value="concrete">خرسانات (Concrete)</option>
                <option value="finishing">تشطيبات (Finishing)</option>
                <option value="mech">ميكانيكا (Mechanical)</option>
                <option value="elec">كهرباء (Electrical)</option>
                <option value="landscape">لاندسكيب (Landscape)</option>
                <option value="water_features">حمامات ومسطحات مائية</option>
                <option value="preliminaries">تجهيزات وموقع</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {loadingRefs ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  جاري تحميل بنود جدول الكميات...
                </div>
              ) : filteredBoqItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لا توجد بنود مطابقة لمعايير البحث في هذا المشروع
                </div>
              ) : (
                filteredBoqItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectBoqItem(item)}
                    className="w-full text-start p-3 rounded-xl hover:bg-emerald-50/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/20 transition flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          {item.item_code}
                        </span>
                        {item.cost_code?.code && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.cost_code.code}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.description_ar}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>الوحدة: <strong className="text-slate-600 dark:text-slate-300">{item.unit}</strong></span>
                        <PriceGate fallback={null}><span>الكمية التعاقدية: <strong className="text-slate-600 dark:text-slate-300 font-mono">{Number(item.contract_qty).toLocaleString()}</strong></span></PriceGate>
                        <PriceGate fallback={null}><span>الفئة: <strong className="text-slate-600 dark:text-slate-300 font-mono">{Number(item.rate_egp).toLocaleString()} EGP</strong></span></PriceGate>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-700 group-hover:text-white transition">{isAr ? 'اختيار' : 'Select'}</span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>تم العثور على {filteredBoqItems.length} بند</span>
              <button
                type="button"
                onClick={() => setActiveLineIndexForPicker(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >{isAr ? 'إغلاق' : 'Close'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Expansion Lightbox Dialog */}
      <DailyPhotoModal
        isOpen={previewPhotoIndex !== null}
        onClose={() => setPreviewPhotoIndex(null)}
        photos={photos.map((p, idx) => ({
          id: `photo-draft-${idx}`,
          daily_progress_id: initialReport?.id || '',
          storage_path: p.storage_path,
          photo_url: p.photo_url,
          caption: p.caption,
        }))}
        initialIndex={previewPhotoIndex || 0}
        reportNo={editingReportNo || undefined}
        progressDate={progressDate}
      />
    </div>
  );
};
