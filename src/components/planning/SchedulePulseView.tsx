'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ExternalLink, 
  Languages, 
  Info, 
  Cpu, 
  Sparkles,
  CheckCircle2,
  FolderGit2,
  Database,
  Loader2,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { generateProjectXer, XerActivityRecord, XerDependencyRecord } from '@/lib/services/xer-generator';
import { parseXER } from '@/lib/scheduleParsers';
import { toast } from 'sonner';
import { SchedulePulseTour } from './SchedulePulseTour';

export interface SchedulePulseViewProps {
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  activities?: XerActivityRecord[] | null;
  dependencies?: XerDependencyRecord[] | null;
  dataDate?: string | Date;
  className?: string;
  onActivitiesCommitted?: () => void;
}

export const SchedulePulseView: React.FC<SchedulePulseViewProps> = ({
  projectId,
  projectName: initialProjectName,
  projectCode: initialProjectCode,
  activities: passedActivities,
  dependencies: passedDependencies,
  dataDate,
  className = '',
  onActivitiesCommitted,
}) => {
  const { locale } = useLanguage();
  const siteIsAr = locale === 'ar';

  const [engineLang, setEngineLang] = useState<'ar' | 'en'>(siteIsAr ? 'ar' : 'en');
  const isAr = engineLang === 'ar';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOpenGuide, setIsOpenGuide] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingToErp, setIsSavingToErp] = useState(false);
  const [stagedXer, setStagedXer] = useState<{
    kind: 'baseline' | 'month';
    name: string;
    text: string;
    activitiesCount?: number;
  } | null>(null);
  const pendingCommitResolverRef = useRef<((xerData: any) => void) | null>(null);
  const latestXerPayloadRef = useRef<{
    type: string;
    projectId: string;
    projectCode: string;
    projectName: string;
    baselineXer: string;
    currentXer: string;
    baselineName: string;
    currentName: string;
    monthLabel: string;
    activitiesCount: number;
    timestamp: number;
  } | null>(null);

  const [engineReady, setEngineReady] = useState(false);
  const [loadedProjectInfo, setLoadedProjectInfo] = useState<{
    id?: string;
    name: string;
    code: string;
    count: number;
    syncedAt?: Date;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlSource = isAr ? '/pulse-engine/schedule-pulse-ar.html' : '/pulse-engine/schedule-pulse-en.html';

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Synchronize project data to the iframe engine, localStorage, and BroadcastChannel
  const syncProjectToEngine = useCallback(async () => {
    if (!projectId) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_PROJECT_DATA' }, '*');
      }
      latestXerPayloadRef.current = null;
      try {
        localStorage.removeItem('pzone_active_pulse_project');
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('pzone_pulse_sync');
          bc.postMessage({ type: 'CLEAR_PROJECT_DATA', timestamp: Date.now() });
          bc.close();
        }
      } catch (e) {}
      setLoadedProjectInfo(null);
      return;
    }

    setIsSyncing(true);

    try {
      let resolvedName = initialProjectName || '';
      let resolvedCode = initialProjectCode || '';
      let pStart: string | null = null;
      let pFinish: string | null = null;

      // 1. Fetch project info if not complete
      if (!resolvedName || !resolvedCode) {
        const { data: proj } = await supabase
          .from('pm_projects')
          .select('project_name, project_code, planned_start_date, planned_finish_date')
          .eq('id', projectId)
          .maybeSingle();

        if (proj) {
          resolvedName = proj.project_name || resolvedName;
          resolvedCode = proj.project_code || resolvedCode;
          pStart = proj.planned_start_date || null;
          pFinish = proj.planned_finish_date || null;
        }
      }

      // 2. Resolve activities
      let actsToLoad: XerActivityRecord[] = [];
      if (passedActivities && passedActivities.length > 0) {
        actsToLoad = passedActivities;
      } else {
        const { data: dbActs } = await supabase
          .from('pm_project_activities')
          .select('id, code, activity_code, name_ar, planned_start, planned_finish, actual_start, actual_finish, duration_days, remaining_duration_days, percent_complete, is_critical, is_milestone, total_float_days, wbs_item_id')
          .eq('project_id', projectId)
          .eq('is_active', true)
          .order('planned_start', { ascending: true })
          .limit(3000);

        if (dbActs && dbActs.length > 0) {
          actsToLoad = dbActs.map((a) => ({
            id: a.id,
            code: a.code || a.activity_code || a.id.slice(0, 8),
            name: a.name_ar || 'نشاط',
            start: a.planned_start,
            finish: a.planned_finish,
            actual_start: a.actual_start,
            actual_finish: a.actual_finish,
            duration: Number(a.duration_days || 1),
            pct: Number(a.percent_complete || 0),
            critical: !!a.is_critical,
            milestone: !!a.is_milestone,
            float: a.total_float_days != null ? Number(a.total_float_days) : null,
            wbs_id: a.wbs_item_id || null,
          }));
        } else {
          // Backward compatibility fallback: check legacy schedules -> activities
          const { data: legacySchedules } = await supabase
            .from('schedules')
            .select('id')
            .eq('project_id', projectId);
          if (legacySchedules && legacySchedules.length > 0) {
            const schedIds = legacySchedules.map((s) => s.id);
            const { data: legacyActs } = await supabase
              .from('activities')
              .select('id, activity_code, name, planned_start, planned_finish, actual_start, actual_finish, duration_days, percent_complete, is_critical, is_milestone, total_float_days, wbs_node_id')
              .in('schedule_id', schedIds)
              .order('planned_start', { ascending: true })
              .limit(3000);

            if (legacyActs && legacyActs.length > 0) {
              actsToLoad = legacyActs.map((a) => ({
                id: a.id,
                code: a.activity_code || a.id.slice(0, 8),
                name: a.name || 'نشاط',
                start: a.planned_start,
                finish: a.planned_finish,
                actual_start: a.actual_start,
                actual_finish: a.actual_finish,
                duration: Number(a.duration_days || 1),
                pct: Number(a.percent_complete || 0),
                critical: !!a.is_critical,
                milestone: !!a.is_milestone,
                float: a.total_float_days != null ? Number(a.total_float_days) : null,
                wbs_id: a.wbs_node_id || null,
              }));
            }
          }
        }
      }

      // If no activities found for this project, clear previous project and notify
      if (actsToLoad.length === 0) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_PROJECT_DATA' }, '*');
        }
        latestXerPayloadRef.current = null;
        try {
          localStorage.removeItem('pzone_active_pulse_project');
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('pzone_pulse_sync');
            bc.postMessage({ type: 'CLEAR_PROJECT_DATA', timestamp: Date.now() });
            bc.close();
          }
        } catch (e) {}
        setLoadedProjectInfo({
          id: projectId,
          name: resolvedName || 'مشروع بدون أنشطة',
          code: resolvedCode || 'PROJ',
          count: 0,
        });
        setIsSyncing(false);
        return;
      }

      // 3. Resolve dependencies
      let depsToLoad: XerDependencyRecord[] = passedDependencies || [];
      if (!depsToLoad || depsToLoad.length === 0) {
        const { data: dbDeps } = await supabase
          .from('pm_activity_dependencies')
          .select('predecessor_id, successor_id, dependency_type, lag_days')
          .eq('project_id', projectId);

        if (dbDeps && dbDeps.length > 0) {
          depsToLoad = dbDeps.map((d) => ({
            predecessor_id: d.predecessor_id,
            successor_id: d.successor_id,
            relationship: (d.dependency_type as 'FS' | 'SS' | 'FF' | 'SF') || 'FS',
            lag_days: Number(d.lag_days || 0),
          }));
        }
      }

      // 4. Generate in-memory Primavera P6 XER
      const { baselineXer, currentXer, activitiesCount } = generateProjectXer({
        project: {
          id: projectId,
          name: resolvedName,
          code: resolvedCode,
          startDate: pStart,
          finishDate: pFinish,
        },
        activities: actsToLoad,
        dependencies: depsToLoad,
        dataDate: dataDate || new Date(),
      });

      // 5. Build payload & cache
      const displayName = `#${resolvedCode || 'PROJ'} — ${resolvedName || 'مشروع'}`;
      const xerPayload = {
        type: 'LOAD_PROJECT_XER',
        projectId,
        projectCode: resolvedCode || 'PROJ',
        projectName: displayName,
        baselineXer,
        currentXer,
        baselineName: `${resolvedCode || 'Project'}-Baseline.xer`,
        currentName: `${resolvedCode || 'Project'}-Current.xer`,
        monthLabel: isAr ? 'التحديث الحالي' : 'Current Status',
        activitiesCount,
        timestamp: Date.now(),
      };

      latestXerPayloadRef.current = xerPayload;

      // 6. Post to iframe engine if available
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(xerPayload, '*');
      }

      // 7. Persist to localStorage for cross-tab & standalone engine persistence
      try {
        localStorage.setItem('pzone_active_pulse_project', JSON.stringify(xerPayload));
      } catch (e) {
        console.warn('[SchedulePulseView] localStorage write error:', e);
      }

      // 8. Broadcast to all open tabs / standalone engine windows
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('pzone_pulse_sync');
          bc.postMessage(xerPayload);
          bc.close();
        }
      } catch (e) {
        console.warn('[SchedulePulseView] BroadcastChannel error:', e);
      }

      setLoadedProjectInfo({
        id: projectId,
        name: resolvedName,
        code: resolvedCode,
        count: activitiesCount,
        syncedAt: new Date(),
      });
    } catch (err: unknown) {
      console.error('[SchedulePulseView] Sync error:', err);
      toast.error(isAr ? 'فشل إرسال بيانات المشروع للمحرك' : 'Failed to sync project to engine');
    } finally {
      setIsSyncing(false);
    }
  }, [
    projectId,
    initialProjectName,
    initialProjectCode,
    passedActivities,
    passedDependencies,
    dataDate,
    isAr,
  ]);

  // Listen to messages from pulse engine iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'PULSE_ENGINE_READY') {
        setEngineReady(true);
        setIsLoading(false);
        syncProjectToEngine();
      } else if (data.type === 'PULSE_ENGINE_PROJECT_LOADED') {
        setIsSyncing(false);
        setIsLoading(false);
      } else if (data.type === 'PULSE_ENGINE_ERROR') {
        setIsSyncing(false);
        setIsLoading(false);
        toast.error(data.error || (isAr ? 'خطأ في معالجة بيانات الجدول' : 'Schedule data error'));
      } else if (data.type === 'PULSE_ENGINE_FILE_DROPPED') {
        setStagedXer({
          kind: data.kind || 'baseline',
          name: data.name || 'Schedule.xer',
          text: data.text,
          activitiesCount: data.activitiesCount || 0,
        });
        toast.info(
          isAr
            ? `تم استلام ملف ${data.name} (${data.activitiesCount || 0} نشاط). اضغط "اعتماد وحفظ بالـ ERP" لتثبيته في قاعدة البيانات.`
            : `Received ${data.name} (${data.activitiesCount || 0} activities). Click "Commit to ERP" to persist.`
        );
      } else if (data.type === 'CURRENT_SCHEDULE_DATA_RESPONSE') {
        if (pendingCommitResolverRef.current) {
          pendingCommitResolverRef.current(data);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [syncProjectToEngine, isAr]);

  // Cross-tab synchronization via BroadcastChannel:
  // Respond to standalone engine tabs requesting the active project payload
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pzone_pulse_sync');
      bc.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'REQUEST_ACTIVE_PULSE_PROJECT') {
          if (latestXerPayloadRef.current) {
            try {
              const replyBc = new BroadcastChannel('pzone_pulse_sync');
              replyBc.postMessage(latestXerPayloadRef.current);
              replyBc.close();
            } catch (e) {}
          }
        }
      };
    } catch (e) {
      console.warn('[SchedulePulseView] Failed to initialize BroadcastChannel listener:', e);
    }

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Two-way commit logic: XER -> ERP Database
  const commitXerText = useCallback(
    async (text: string, fileName: string, kind: 'baseline' | 'month') => {
      if (!projectId) {
        toast.error(isAr ? 'يرجى اختيار المشروع أولاً' : 'Please select a project first');
        return;
      }
      setIsSavingToErp(true);
      try {
        const parsed = parseXER(text, projectId);
        if (!parsed.activities || parsed.activities.length === 0) {
          throw new Error(isAr ? 'لم يتم العثور على أنشطة صالحة في ملف XER' : 'No valid activities found in XER');
        }

        const rows = parsed.activities.slice(0, 3000).map((a) => ({
          project_id: projectId,
          wbs_code: a.wbs_code || null,
          code: a.activity_id || a.id.slice(0, 10),
          activity_code: a.activity_id || a.id.slice(0, 10),
          name_ar: a.activity_name || 'نشاط',
          planned_start: a.planned_start ? new Date(a.planned_start).toISOString() : null,
          planned_finish: a.planned_finish ? new Date(a.planned_finish).toISOString() : null,
          actual_start: a.actual_start ? new Date(a.actual_start).toISOString() : null,
          actual_finish: a.actual_finish ? new Date(a.actual_finish).toISOString() : null,
          duration_days: Math.max(1, Math.round(a.duration_days) || 1),
          percent_complete: Number(a.percent_complete || 0),
          is_critical: !!a.is_critical,
          is_milestone: !!a.is_milestone,
          status: a.percent_complete >= 100 ? 'completed' : a.percent_complete > 0 ? 'in_progress' : 'not_started',
          is_active: true,
        }));

        const res = await fetch('/api/planning/activities/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            activities: rows,
            dependencies: (parsed.dependencies || []).map((d) => ({
              predecessor_code: d.predecessor_id,
              successor_code: d.successor_id,
              rel: d.relationship,
              lag_days: d.lag_days,
            })),
            wbsItems: parsed.wbsItems || [],
            fileName,
            versionType: kind === 'baseline' ? 'baseline' : 'update',
            versionTitle:
              kind === 'baseline'
                ? isAr
                  ? `الجدول الأساسي المعتمد (${fileName})`
                  : `Approved Baseline (${fileName})`
                : isAr
                ? `تحديث شهري (${fileName})`
                : `Monthly Update (${fileName})`,
            replaceExisting: kind === 'baseline',
          }),
        });

        const resData = await res.json();
        if (!res.ok || resData.error) {
          throw new Error(resData.error || `Server commit failed (${res.status})`);
        }

        toast.success(
          isAr
            ? `تم اعتماد وحفظ ${resData.count || rows.length} نشاط في قاعدة بيانات المشروع بنجاح!`
            : `Successfully committed ${resData.count || rows.length} activities to project database!`
        );

        setStagedXer(null);
        setLoadedProjectInfo((prev) =>
          prev ? { ...prev, count: resData.count || rows.length, syncedAt: new Date() } : null
        );

        // Notify parent page so Gantt and CPM tabs reload immediately
        onActivitiesCommitted?.();
      } catch (err: any) {
        console.error('[SchedulePulseView] Commit error:', err);
        toast.error(err.message || (isAr ? 'فشل حفظ الأنشطة بقاعدة البيانات' : 'Failed to commit activities to database'));
      } finally {
        setIsSavingToErp(false);
      }
    },
    [projectId, isAr, onActivitiesCommitted]
  );

  const handleTriggerCommit = useCallback(() => {
    if (!projectId) {
      toast.error(isAr ? 'يرجى اختيار المشروع أولاً' : 'Please select a project first');
      return;
    }
    if (stagedXer && stagedXer.text) {
      commitXerText(stagedXer.text, stagedXer.name, stagedXer.kind);
      return;
    }

    // If no staged drop, request current schedule from iframe
    if (!iframeRef.current?.contentWindow) return;
    setIsSavingToErp(true);

    const timeout = setTimeout(() => {
      setIsSavingToErp(false);
      pendingCommitResolverRef.current = null;
      toast.error(isAr ? 'انتهت مهلة استرجاع بيانات المحرك' : 'Timed out requesting schedule data from engine');
    }, 10000);

    pendingCommitResolverRef.current = (data: any) => {
      clearTimeout(timeout);
      pendingCommitResolverRef.current = null;
      if (!data.hasBaseline || !data.baselineText) {
        setIsSavingToErp(false);
        toast.error(isAr ? 'لا يوجد ملف جدول زمني مفتوح لاعتماده' : 'No schedule file currently loaded to commit');
        return;
      }
      commitXerText(data.baselineText, data.baselineName || 'Baseline.xer', 'baseline');
    };

    iframeRef.current.contentWindow.postMessage({ type: 'GET_CURRENT_SCHEDULE_DATA' }, '*');
  }, [projectId, stagedXer, commitXerText, isAr]);

  // Sync whenever projectId, activities, or engineReady changes
  useEffect(() => {
    if (engineReady && iframeRef.current?.contentWindow) {
      syncProjectToEngine();
    }
  }, [projectId, passedActivities, engineReady, syncProjectToEngine]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleReload = useCallback(() => {
    setIsReloading(true);
    setIsLoading(true);
    setEngineReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = htmlSource;
    }
    setTimeout(() => {
      setIsReloading(false);
    }, 600);
  }, [htmlSource]);

  const handleToggleLang = useCallback(() => {
    setEngineLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
    setIsLoading(true);
    setEngineReady(false);
  }, []);



  return (
    <div
      data-testid="schedule-pulse-view"
      className={`space-y-3 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden'
          : `w-full ${className}`
      }`}
    >
      {/* ── Studio Top Command Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Left / Title & Branding */}
        <div id="tour-project-info" data-testid="tour-project-info" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isAr ? 'محرك نبض الجدول الزمني (EHS Studio)' : 'EHS Schedule Pulse Studio'}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                v2.4 Pro
              </span>
              {loadedProjectInfo && loadedProjectInfo.count > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>
                    {isAr
                      ? `متزامن: #${loadedProjectInfo.code} (${loadedProjectInfo.count} نشاط)`
                      : `Synced: #${loadedProjectInfo.code} (${loadedProjectInfo.count} acts)`}
                  </span>
                </span>
              )}
              {stagedXer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold animate-pulse">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>
                    {isAr
                      ? `جاهز للاعتماد: ${stagedXer.name} (${stagedXer.activitiesCount || 0} نشاط)`
                      : `Ready: ${stagedXer.name} (${stagedXer.activitiesCount || 0} acts)`}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {isAr
                ? 'إعداد: م. حسن أحمد سليمان · 01229994728 · متصل مباشرة بالمشروع النشط في البوابة'
                : 'Dev by Eng. Hassan A. Soliman · 01229994728 · Live Sync with Active ERP Project'}
            </p>
          </div>
        </div>

        {/* Right / Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* User Guide & Tour Trigger Button */}
          <button
            id="tour-guide-btn"
            data-testid="tour-guide-btn"
            type="button"
            onClick={() => setIsOpenGuide(true)}
            aria-label={isAr ? 'دليل الاستخدام والجولة الإرشادية التفاعلية' : 'User Guide & Interactive Tour'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer min-h-[38px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={isAr ? 'دليل الاستخدام والجولة الإرشادية التفاعلية' : 'User Guide & Interactive Tour'}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'دليل وجولة' : 'Guide & Tour'}</span>
          </button>

          {/* Commit & Save to ERP DB Button */}
          <button
            id="tour-commit-btn"
            data-testid="tour-commit-btn"
            type="button"
            onClick={handleTriggerCommit}
            disabled={isSavingToErp || !projectId}
            aria-label={isAr ? 'اعتماد وحفظ بيانات وأنشطة الجدول بالـ ERP' : 'Commit and save schedule activities to ERP'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              stagedXer
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                : 'border border-emerald-500/40 dark:border-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              isAr
                ? 'اعتماد وحفظ بيانات وأنشطة الجدول الزمني مباشرة في قاعدة بيانات المنظومة'
                : 'Commit and save schedule activities directly into ERP database'
            }
          >
            {isSavingToErp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>
              {isSavingToErp
                ? (isAr ? 'جاري الحفظ...' : 'Committing...')
                : stagedXer
                ? (isAr ? `اعتماد وحفظ (${stagedXer.activitiesCount || 'جديد'})` : `Commit (${stagedXer.activitiesCount || 'New'})`)
                : (isAr ? 'اعتماد وحفظ بالـ ERP' : 'Commit to ERP')}
            </span>
          </button>

          {/* Sync Active Project Button */}
          <button
            id="tour-sync-btn"
            data-testid="tour-sync-btn"
            type="button"
            onClick={syncProjectToEngine}
            disabled={isSyncing || !projectId}
            aria-label={isAr ? 'مزامنة بيانات المشروع المفتوح حالياً مع المحرك' : 'Sync open project activities with engine'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isAr ? 'مزامنة بيانات المشروع المفتوح حالياً مع المحرك' : 'Sync open project activities with engine'}
          >
            <Database className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة المشروع' : 'Sync Project')}</span>
          </button>

          {/* Controls Group */}
          <div id="tour-controls" data-testid="tour-controls" className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              id="tour-lang-btn"
              data-testid="tour-lang-btn"
              type="button"
              onClick={handleToggleLang}
              aria-label={isAr ? 'التحويل إلى الواجهة الإنجليزية' : 'Switch to Arabic Interface'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={isAr ? 'التحويل إلى الواجهة الإنجليزية' : 'Switch to Arabic Interface'}
            >
              <Languages className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{isAr ? 'English (EN)' : 'عربي (AR)'}</span>
            </button>

            {/* Reload Engine */}
            <button
              id="tour-reload-btn"
              data-testid="tour-reload-btn"
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              aria-label={isAr ? 'إعادة تحميل المحرك وتحديث الذاكرة' : 'Reload engine and refresh state'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isAr ? 'إعادة تحميل المحرك وتحديث الذاكرة' : 'Reload engine and refresh state'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 ${isReloading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث' : 'Reload'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              id="tour-fullscreen-btn"
              data-testid="tour-fullscreen-btn"
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? (isAr ? 'إنهاء وضع ملء الشاشة (ESC)' : 'Exit Fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              title={isFullscreen ? (isAr ? 'إنهاء وضع ملء الشاشة (ESC)' : 'Exit Fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>{isAr ? 'تصغير' : 'Exit'}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>{isAr ? 'ملء الشاشة' : 'Fullscreen'}</span>
                </>
              )}
            </button>

            {/* External Window Popout */}
            <a
              id="tour-popout-btn"
              data-testid="tour-popout-btn"
              href={`${htmlSource}${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[38px] no-underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              title={isAr ? 'فتح المحرك كنافذة مستقلة بالمتصفح' : 'Open engine in dedicated browser tab'}
              aria-label={isAr ? 'فتح المحرك كنافذة مستقلة بالمتصفح' : 'Open engine in dedicated browser tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'نافذة مستقلة' : 'Popout'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Status Banner for Empty Activities Project ── */}
      {loadedProjectInfo && loadedProjectInfo.count === 0 && (
        <div data-testid="empty-project-banner" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs text-slate-800 dark:text-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {isAr ? 'جاهز للاستيراد والتحليل الفوري' : 'Ready for Ingestion & Live Analysis'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                  {loadedProjectInfo.code}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {isAr ? (
                  <>
                    المشروع (<strong>{loadedProjectInfo.name}</strong>) بانتظار رفع ملف خط الأساس <code>.xer</code>. يمكنك السحب والإفلات بالمحرك أدناه أو استعراض النموذج التوضيحي.
                  </>
                ) : (
                  <>
                    Project (<strong>{loadedProjectInfo.name}</strong>) awaits baseline <code>.xer</code>. Drop below or explore live sample demo.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="load-sample-btn"
            aria-label={isAr ? 'تجربة مشروع توضيحي' : 'Try Sample Project'}
            onClick={() => {
              try {
                const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
                doc?.getElementById('loadSampleBtn')?.click();
              } catch (e) {}
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-500/30 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold text-xs transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'تجربة مشروع توضيحي' : 'Try Sample Project'}</span>
          </button>
        </div>
      )}

      {/* ── Main Iframe Container ── */}
      <div
        id="tour-engine-frame"
        data-testid="tour-engine-frame"
        className={`relative w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden ${
          isFullscreen ? 'flex-1 h-full' : 'h-[calc(100vh-14rem)] min-h-[750px]'
        }`}
      >
        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div data-testid="pulse-engine-loading" className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
              <Cpu className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'جاري تهيئة محرك نبض الجدول الزمني ومزامنة المشروع...' : 'Initializing EHS Schedule Pulse & synchronizing project...'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {isAr ? 'توليد مسارات القيادة الحرجة ومنحنيات S-Curve في ذاكرة المتصفح...' : 'Generating in-memory driving critical paths & S-Curves...'}
              </p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          data-testid="pulse-engine-iframe"
          src={htmlSource}
          title={isAr ? 'محرك نبض الجدول الزمني - م. حسن سليمان' : 'EHS Schedule Pulse Studio - Eng. Hassan Soliman'}
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-modals allow-forms allow-popups"
          allow="clipboard-write; fullscreen"
          onLoad={() => {
            // Signal ping once iframe loads
            try {
              iframeRef.current?.contentWindow?.postMessage({ type: 'PING_PULSE_ENGINE' }, '*');
            } catch (e) {}
          }}
        />
      </div>

      {/* ── Interactive Tour & User Guide Modal ── */}
      <SchedulePulseTour
        isAr={isAr}
        isOpenGuide={isOpenGuide}
        onCloseGuide={() => setIsOpenGuide(false)}
        isTourActive={isTourActive}
        onStartTour={() => {
          setIsOpenGuide(false);
          setIsTourActive(true);
        }}
        onCloseTour={() => setIsTourActive(false)}
      />
    </div>
  );
};
