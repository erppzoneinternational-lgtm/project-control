'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  GanttChartSquare, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2,
  ArrowRight, Table2, TrendingUp, TrendingDown, Minus, Layers, Check, BarChart3, PieChart as PieIcon, Telescope, RefreshCw,
  CalendarClock, Gauge, Printer, FileDown, GitBranch, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import { parseXER, calculateDCMA14, ParsedWbsRecord } from '@/lib/scheduleParsers';
import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS } from '@/lib/cache';
import { toast } from 'sonner';
import GanttChart, { GanttActivity } from '@/components/planning/GanttChart';
import CPMNetworkGraph from '@/components/planning/CPMNetworkGraph';
import BaselineVersionActions, { isReferenceVersion } from '@/components/planning/BaselineVersionActions';
import { ScheduleVersionService, ScheduleVersion } from '@/lib/services/schedule-version.service';
import { useLanguage } from '@/contexts/LanguageContext';
import ScheduleCompareTools from '@/components/planning/ScheduleCompare'; /* [schedule-compare] */
import WeeklyReportsPanel from '@/components/planning/WeeklyReportsPanel'; /* [weekly-reports] */
import { SchedulePulseView } from '@/components/planning/SchedulePulseView';
import type { ActivityDependency } from '@/types/schedule';

import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Normalized activity ── */
interface Act extends GanttActivity {
  wbs_code?: string;
  wbs_id?: string;
  schedule_version_id?: string | null;
}

const DAY = 86400000;
const fmtEGP = (v: number) => new Intl.NumberFormat('eg-EG', { maximumFractionDigits: 0 }).format(v || 0);
const fmtD = (d: Date | null) => (d ? new Intl.DateTimeFormat('eg-EG', { day: '2-digit', month: 'short' }).format(d) : '—');
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];
const toKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/* Linear proration: fraction of activity completed by date t (SchedulePro "prorated to cut-off") */
function plannedFraction(a: Act, t: Date): number {
  if (!a.start || !a.finish) return 0;
  const s = a.start.getTime(), f = a.finish.getTime(), x = t.getTime();
  if (x <= s) return 0;
  if (x >= f) return 1;
  return (x - s) / Math.max(1, f - s);
}

interface ParsedAct {
  activity_id?: string; code?: string; activity_name?: string; name?: string;
  wbs_code?: string; wbs_id?: string; planned_start?: string; planned_finish?: string;
  duration_days?: number | string; percent_complete?: number | string;
  is_critical?: boolean; is_milestone?: boolean; notes?: string;
}

export default function BaselinePage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles: userRoles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/planning/baseline', userRoles || [], isAdmin, dbAccessRules) ||
      canEditPath('/planning', userRoles || [], isAdmin, dbAccessRules));
  const [viewTab, setViewTab] = useState<'gantt' | 'graph' | 'analytics' | 'pulse' | 'reports'>('pulse');
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('all');
  const [projects, setProjects] = useState<{ id: string; label: string }[]>([]);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');

  // Two-way sync: keep selectedProjectId in sync when activeProjectId changes from the global store
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // Two-way sync: handler when user changes project in baseline page dropdown
  const handleProjectChange = (newId: string) => {
    setSelectedProjectId(newId);
    setActiveProjectId(newId);
  };

  const projectId = selectedProjectId;
  const setProjectId = handleProjectChange;
  const [savedActs, setSavedActs] = useState<Act[] | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  /* data date (cut-off) — defaults to today */
  const [dataDate, setDataDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  /* parse flow */
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const parsedActsRef = useRef<Act[] | null>(null);
  const parsedDepsRef = useRef<ActivityDependency[]>([]);
  const parsedWbsRef = useRef<ParsedWbsRecord[]>([]);
  const [parsedMeta, setParsedMeta] = useState<{ fileName: string; count: number; deps: number; dcma: ReturnType<typeof calculateDCMA14> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('pm_projects_with_manager').select('id, project_code, project_name').is('deleted_at', null).order('project_code');
      const list = (data || []).map((p) => ({ id: p.id, label: `#${p.project_code} — ${p.project_name}` }));
      setProjects(list);
      if (list.length > 0 && !activeProjectId && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
        setActiveProjectId(list[0].id);
      }
    })();
  }, [activeProjectId, setActiveProjectId, selectedProjectId]);

  /* versions ribbon */
  const loadVersions = React.useCallback(async (pid: string) => {
    if (!pid) { setVersions([]); return; }
    setVersions(await ScheduleVersionService.list(pid));
  }, []);

  /* reload activities after any inline edit in the Gantt */
  const reloadSaved = React.useCallback(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from('pm_project_activities')
        .select('id, code, name_ar, planned_start, planned_finish, duration_days, percent_complete, is_critical, is_milestone, total_float_days, schedule_version_id')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('planned_start', { ascending: true })
        .limit(3000);
      setSavedActs((data || []).map((a) => ({
        id: a.id,
        code: a.code || '', name: a.name_ar || (isAr ? 'نشاط' : 'Activity'),
        schedule_version_id: a.schedule_version_id || null,
        start: a.planned_start ? new Date(a.planned_start) : null,
        finish: a.planned_finish ? new Date(a.planned_finish) : null,
        duration: Number(a.duration_days || 0), pct: Number(a.percent_complete || 0),
        critical: !!a.is_critical, milestone: !!a.is_milestone,
        float: a.total_float_days != null ? Number(a.total_float_days) : null,
      })));
    })();
  }, [projectId, isAr]);

  useEffect(() => {
    const handler = () => reloadSaved();
    window.addEventListener('schedule-activity-updated', handler);
    return () => window.removeEventListener('schedule-activity-updated', handler);
  }, [reloadSaved]);



  useEffect(() => { loadVersions(projectId); }, [projectId, loadVersions]);

  /* ── Reports ── */
  const exportCSV = () => {
    if (!acts.length) return;
    const rows = [
      ['Code', 'Name', 'Start', 'Finish', 'Duration', 'Percent', 'Critical', 'Milestone', 'Float'],
      ...acts.map((a) => [
        a.code, a.name,
        a.start ? a.start.toISOString().slice(0, 10) : '',
        a.finish ? a.finish.toISOString().slice(0, 10) : '',
        a.duration, a.pct, a.critical ? 'Y' : 'N', a.milestone ? 'Y' : 'N', a.float ?? '',
      ]),
    ];
    const csv = '\ufeff' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-${projectId || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير ملف البيانات (CSV) بنجاح' : 'CSV file exported successfully');
  };

  const printReport = () => {
    if (!acts.length) return;
    const evmRows = evm ? `
      <tr><td>${isAr ? 'إجمالي أيام العمل المخططة (BAC)' : 'BAC (Planned Days)'}</td><td>${Math.round(evm.BAC)}</td></tr>
      <tr><td>${isAr ? 'القيمة المخططة حتى التاريخ (PV)' : 'PV (Planned to Date)'}</td><td>${Math.round(evm.PV)}</td></tr>
      <tr><td>${isAr ? 'القيمة المكتسبة المحققة (EV)' : 'EV (Earned to Date)'}</td><td>${Math.round(evm.EV)}</td></tr>
      <tr><td>${isAr ? 'مؤشر كفاءة الأداء الزمني (SPI)' : 'SPI'}</td><td>${evm.SPI.toFixed(2)}</td></tr>
      <tr><td>${isAr ? 'انحراف الجدول الزمني بالأيام (SV)' : 'SV (Schedule Variance)'}</td><td>${Math.round(evm.SV)}</td></tr>
      <tr><td>${isAr ? 'المدة التقديرية الكلية للإنجاز (EAC)' : 'EAC (Forecast Days)'}</td><td>${Math.round(evm.EAC)}</td></tr>` : '';
    const delayRows = delays.slice(0, 20).map((a) =>
      `<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(fmtD(a.finish))}</td><td>+${escapeHtml(a.lateDays)}</td><td>${Math.round(a.pct)}%</td></tr>`
    ).join('');
    const laRows = lookAhead.slice(0, 20).map((a) =>
      `<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(fmtD(a.start))}</td><td>${escapeHtml(fmtD(a.finish))}</td><td>${escapeHtml(a.duration)}</td></tr>`
    ).join('');

    const projectTitleEscaped = escapeHtml(projects.find((x) => x.id === projectId)?.label || (isAr ? 'المشروع' : 'Project'));
    const generatedAtEscaped = escapeHtml(new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US'));
    const cutOffEscaped = escapeHtml(fmtD(cutOff));
    const minStartEscaped = escapeHtml(fmtD(kpis && kpis.total ? acts.reduce((s, a) => (a.start && (!s || a.start < s)) ? a.start : s, null as Date | null) : null));
    const maxFinishEscaped = escapeHtml(fmtD(kpis ? (acts.map((a) => a.finish).filter(Boolean).sort((x, y) => Number(y) - Number(x))[0] || null) : null));

    const htmlContent = `<!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}"><head><meta charset="utf-8">
      <title>${isAr ? 'تقرير المتابعة الزمنية للمشروع' : 'Project Schedule Report'}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body{font-family:'Segoe UI',Tahoma,sans-serif;padding:24px;color:#1e293b;background:#fff}
        h1{font-size:20px;color:#4338ca;margin:0 0 2px}
        .sub{font-size:11px;color:#64748b;margin-bottom:18px}
        .meta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:11px;margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap}
        h2{font-size:14px;color:#334155;border-bottom:2px solid #6366f1;padding-bottom:4px;margin:20px 0 8px}
        table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px}
        th{background:#4338ca;color:#fff;padding:6px 8px;text-align:${isAr ? 'right' : 'left'}}
        td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:6px}
        .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center}
        .kpi b{display:block;font-size:16px;color:#4338ca}
        .kpi span{font-size:9px;color:#64748b}
        @media print{
          body{padding:0}
          .noprint{display:none}
        }
      </style></head><body>
      <h1>${isAr ? 'تقرير المتابعة الزمنية — ' : 'Schedule Report — '}${projectTitleEscaped}</h1>
      <div class="sub">${isAr ? 'تاريخ التقرير:' : 'Generated on:'} ${generatedAtEscaped} · ${isAr ? 'تاريخ استخراج البيانات:' : 'Data Date:'} ${cutOffEscaped}</div>
      <div class="meta">
        <span><b>${kpis?.total}</b> ${isAr ? 'نشاط مسجل' : 'activities'}</span>
        <span><b>${kpis?.critical}</b> ${isAr ? 'على المسار الحرج' : 'critical activities'}</span>
        <span><b>${kpis?.milestones}</b> ${isAr ? 'معلم رئيسي' : 'milestones'}</span>
        <span>${minStartEscaped} → ${maxFinishEscaped}</span>
      </div>
      <div class="kpis">
        <div class="kpi"><b>${Math.round(evm?.pctComplete ?? 0)}%</b><span>${isAr ? 'الإنجاز الفعلي' : 'Actual %'}</span></div>
        <div class="kpi"><b>${Math.round(evm?.plannedPct ?? 0)}%</b><span>${isAr ? 'المخطط حتى اليوم' : 'Planned to Date'}</span></div>
        <div class="kpi"><b>${evm ? evm.SPI.toFixed(2) : '—'}</b><span>${isAr ? 'مؤشر كفاءة الأداء الزمني' : 'SPI'}</span></div>
        <div class="kpi"><b>${evm ? Math.round(evm.EAC) : '—'}</b><span>${isAr ? 'المدة التقديرية الكلية' : 'EAC (Days)'}</span></div>
      </div>
      ${evmRows ? `<h2>${isAr ? 'مؤشرات القيمة المكتسبة' : 'Earned Value Analysis'}</h2><table><thead><tr><th>${isAr ? 'المؤشر' : 'Metric'}</th><th>${isAr ? 'القيمة' : 'Value'}</th></tr></thead><tbody>${evmRows}</tbody></table>` : ''}
      ${delayRows ? `<h2>${isAr ? 'تحليل التأخير' : 'Delay Analysis'} (${delays.length} ${isAr ? 'نشاط متأخر' : 'delayed activities'})</h2><table><thead><tr><th>${isAr ? 'كود النشاط' : 'Code'}</th><th>${isAr ? 'اسم النشاط' : 'Activity'}</th><th>${isAr ? 'تاريخ الانتهاء المخطط' : 'Planned Finish'}</th><th>${isAr ? 'مدة التأخير' : 'Delay'}</th><th>${isAr ? 'نسبة الإنجاز' : 'Completion'}</th></tr></thead><tbody>${delayRows}</tbody></table>` : ''}
      ${laRows ? `<h2>${isAr ? 'الأنشطة المستقبلية — تبدأ خلال 60 يوماً' : 'Look-Ahead — Starts within 60 Days'}</h2><table><thead><tr><th>${isAr ? 'كود النشاط' : 'Code'}</th><th>${isAr ? 'اسم النشاط' : 'Activity'}</th><th>${isAr ? 'تاريخ البدء' : 'Start'}</th><th>${isAr ? 'تاريخ الانتهاء' : 'Finish'}</th><th>${isAr ? 'المدة' : 'Duration'}</th></tr></thead><tbody>${laRows}</tbody></table>` : ''}
      <h2>${isAr ? 'قائمة الأنشطة التفصيلية' : 'Detailed Activities List'} (${acts.length})</h2>
      <table><thead><tr><th>${isAr ? 'كود النشاط' : 'Code'}</th><th>${isAr ? 'اسم النشاط' : 'Activity'}</th><th>${isAr ? 'تاريخ البدء' : 'Start'}</th><th>${isAr ? 'تاريخ الانتهاء' : 'Finish'}</th><th>${isAr ? 'المدة' : 'Duration'}</th><th>%</th><th>${isAr ? 'حرج' : 'Critical'}</th></tr></thead><tbody>
      ${acts.map((a) => `<tr><td>${escapeHtml(a.code)}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(fmtD(a.start))}</td><td>${escapeHtml(fmtD(a.finish))}</td><td>${escapeHtml(a.duration)}</td><td>${Math.round(a.pct)}%</td><td>${a.critical ? '⚠' : ''}</td></tr>`).join('')}
      </tbody></table>
      </body></html>`;

    // Try printing via hidden iframe (bypasses browser pop-up blocker completely)
    try {
      let printFrame = document.getElementById('planning-print-iframe') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'planning-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }
      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        }, 300);
        toast.success(isAr ? 'جاري فتح نافذة الطباعة / حفظ PDF' : 'Opening print dialog');
        return;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: window.open
    const w = window.open('', '_blank');
    if (!w) {
      // If popup blocker still caught it, download as HTML file directly
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.info(isAr ? 'تم تنزيل التقرير لفتحه وطباعته مباشرة' : 'Report downloaded');
      return;
    }
    w.document.write(htmlContent);
    w.document.close();
    toast.success(isAr ? 'التقرير جاهز — اطبع أو احفظ PDF' : 'Report ready');
  };

  useEffect(() => {
    setSavedActs(null);
    setSavedCount(null);
    setParsedMeta(null);
    parsedActsRef.current = null;
    setSelectedVersionId('all');
    if (!projectId) return;
    (async () => {
      setLoadingSaved(true);
      const { data } = await supabase
        .from('pm_project_activities')
        .select('id, code, name_ar, planned_start, planned_finish, duration_days, percent_complete, is_critical, is_milestone, total_float_days, schedule_version_id')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('planned_start', { ascending: true })
        .limit(3000);
      setSavedActs(
        (data || []).map((a) => ({
          id: a.id,
          code: a.code || '',
          name: a.name_ar || (isAr ? 'نشاط' : 'Activity'),
          schedule_version_id: a.schedule_version_id || null,
          start: a.planned_start ? new Date(a.planned_start) : null,
          finish: a.planned_finish ? new Date(a.planned_finish) : null,
          duration: Number(a.duration_days || 0),
          pct: Number(a.percent_complete || 0),
          critical: !!a.is_critical,
          milestone: !!a.is_milestone,
          float: a.total_float_days != null ? Number(a.total_float_days) : null,
        }))
      );
      setLoadingSaved(false);
    })();
  }, [projectId, isAr]);

  const handleFile = async (file: File) => {
    if (!canEdit) return;
    if (!file.name.toLowerCase().endsWith('.xer')) {
      toast.error(isAr ? 'الملف يجب أن يكون بصيغة بريمافيرا (XER)' : 'File must be Primavera XER format');
      return;
    }
    setParsing(true);
    setParsedMeta(null);
    setSavedCount(null);
    try {
      const text = await file.text();
      const parsed = parseXER(text, projectId || 'adhoc');
      if (!parsed.activities.length) {
        toast.error(isAr ? 'لم يتم العثور على أنشطة داخل الملف' : 'No activities found in file');
        return;
      }
      parsedWbsRef.current = parsed.wbsItems || [];
      const dcma = calculateDCMA14(parsed.activities as unknown as Parameters<typeof calculateDCMA14>[0], parsed.dependencies as unknown as Parameters<typeof calculateDCMA14>[1]);
      const acts: Act[] = (parsed.activities as unknown as ParsedAct[]).map((a) => ({
        // parser outputs planned_start/planned_finish (ISO strings) — NEVER empty (falls back to now)
        code: a.activity_id || a.code || '',
        name: a.activity_name || a.name || (isAr ? 'نشاط' : 'Activity'),
        wbs_code: a.wbs_code || '',
        wbs_id: a.wbs_id || '',
        start: a.planned_start ? new Date(a.planned_start) : null,
        finish: a.planned_finish ? new Date(a.planned_finish) : null,
        duration: Number(a.duration_days || 0),
        pct: Number(a.percent_complete || 0),
        critical: !!a.is_critical,
        milestone: !!a.is_milestone,
        // parser embeds float in notes as "[Float: 12]"
        float: (() => {
          const m = (a.notes || '').match(/\[Float: (-?\d+)\]/);
          return m ? Number(m[1]) : null;
        })(),
      }));
      parsedActsRef.current = acts;
      parsedDepsRef.current = parsed.dependencies || [];
      setParsedMeta({ fileName: file.name, count: acts.length, deps: parsed.dependencies.length, dcma });
      toast.success(isAr ? `تم تحليل ${acts.length} نشاطاً من الملف بنجاح` : `Parsed ${acts.length} activities from ${file.name}`);
    } catch (e: unknown) {
      console.error(e);
      toast.error(isAr ? ('فشل تحليل الملف: ' + ((e as Error).message || 'ملف غير صالح')) : ('Failed to parse file: ' + ((e as Error).message || 'Invalid file')));
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    const acts = parsedActsRef.current;
    if (!acts || !projectId) {
      toast.error(isAr ? 'يرجى اختيار المشروع أولاً' : 'Please select a project first');
      return;
    }
    setSaving(true);
    try {
      // Ingest WBS items if present in XER
      const wbsCodeToIdMap = new Map<string, string>();
      const primaWbsIdToDbId = new Map<string, string>();
      const parsedWbs = parsedWbsRef.current;

      if (parsedWbs && parsedWbs.length > 0) {
        try {
          const { data: existingWbs } = await supabase
            .from('pm_wbs_items')
            .select('id, wbs_code')
            .eq('project_id', projectId);

          (existingWbs || []).forEach((w) => {
            if (w.wbs_code) wbsCodeToIdMap.set(w.wbs_code.trim().toUpperCase(), w.id);
          });

          // Build Primavera parent-child graph and compute real hierarchy levels
          const primaNodeMap = new Map<string, ParsedWbsRecord>();
          parsedWbs.forEach((w) => {
            if (w.wbs_id) primaNodeMap.set(w.wbs_id, w);
          });

          const computeLevel = (rec: ParsedWbsRecord, visited = new Set<string>()): number => {
            if (!rec.parent_wbs_id || !primaNodeMap.has(rec.parent_wbs_id) || visited.has(rec.wbs_id)) {
              return 1;
            }
            visited.add(rec.wbs_id);
            const parent = primaNodeMap.get(rec.parent_wbs_id)!;
            return 1 + computeLevel(parent, visited);
          };

          const itemsWithLevel = parsedWbs.map((w) => ({
            ...w,
            computedLevel: computeLevel(w),
          }));

          const maxLvl = Math.max(...itemsWithLevel.map((w) => w.computedLevel), 1);

          // Insert level-by-level so parents exist before children can reference them
          for (let lvl = 1; lvl <= maxLvl; lvl++) {
            const atLvl = itemsWithLevel.filter((w) => w.computedLevel === lvl);
            const toInsert = atLvl
              .filter((w) => w.wbs_short_name && !wbsCodeToIdMap.has(w.wbs_short_name.trim().toUpperCase()))
              .map((w, idx) => {
                const parentDbId = w.parent_wbs_id ? primaWbsIdToDbId.get(w.parent_wbs_id) : null;
                return {
                  project_id: projectId,
                  parent_id: parentDbId || null,
                  wbs_code: w.wbs_short_name.trim().toUpperCase(),
                  title_ar: w.wbs_name || w.wbs_short_name,
                  title_en: w.wbs_name || w.wbs_short_name,
                  sort_order: w.seq_num ?? (idx + 1),
                  level: lvl,
                  status: 'not_started',
                };
              });

            if (toInsert.length > 0) {
              const { data: insertedWbs, error: wbsErr } = await supabase
                .from('pm_wbs_items')
                .insert(toInsert)
                .select('id, wbs_code');

              if (!wbsErr && insertedWbs) {
                insertedWbs.forEach((row) => {
                  if (row.wbs_code) {
                    wbsCodeToIdMap.set(row.wbs_code.trim().toUpperCase(), row.id);
                  }
                });
              }
            }

            // Map each record at this level to its db ID
            atLvl.forEach((w) => {
              const dbId = wbsCodeToIdMap.get(w.wbs_short_name.trim().toUpperCase());
              if (dbId) {
                primaWbsIdToDbId.set(w.wbs_id, dbId);
              }
            });
          }
        } catch (wbsErr) {
          console.warn('[handleSave] WBS ingestion warning:', wbsErr);
        }
      }

      const rows = acts.slice(0, 2000).map((a) => {
        const matchedWbsId =
          (a.wbs_id && primaWbsIdToDbId.get(a.wbs_id)) ||
          (a.wbs_code && wbsCodeToIdMap.get(a.wbs_code.trim().toUpperCase())) ||
          null;
        return {
          project_id: projectId,
          wbs_item_id: matchedWbsId || null,
          code: a.code || null,
          // activity_code is the canonical column read by weekly reports &
          // allocation — keep both in sync (weeklyReport.service reads activity_code)
          activity_code: a.code || null,
          name_ar: a.name || (isAr ? 'نشاط' : 'Activity'),
          planned_start: a.start ? a.start.toISOString() : null,
          planned_finish: a.finish ? a.finish.toISOString() : null,
          duration_days: Math.max(1, Math.round(a.duration) || 1),
          percent_complete: a.pct || 0,
          total_float_days: a.float,
          is_critical: a.critical,
          is_milestone: a.milestone,
          status: a.pct >= 100 ? 'completed' : a.pct > 0 ? 'in_progress' : 'not_started',
          is_active: true,
        };
      });
      let insertedCount = rows.length;

      // Primary: Route through server API which uses service role to bypass browser RLS policy blockers
      try {
        const res = await fetch('/api/planning/activities/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            activities: rows,
            fileName: parsedMeta?.fileName || 'XER',
          }),
        });
        const result = await res.json();
        if (!res.ok || result.error) {
          throw new Error(result.error || `Server import failed (${res.status})`);
        }
        insertedCount = result.count || rows.length;
        if (result.version) {
          const vType = result.version.version_type;
          toast.success(isAr ? `تم التسجيل كإصدار ${vType === 'baseline' ? 'خط الأساس' : 'تحديث دوري'} رقم ${result.version.version_no}` : `Registered as ${vType === 'baseline' ? 'Baseline' : 'Update'} v${result.version.version_no}`);
          loadVersions(projectId);
        }
      } catch (apiErr) {
        console.warn('[handleSave] Server API import fallback, attempting direct client insert:', apiErr);
        // Fallback: direct Supabase insert
        const { data: inserted, error } = await supabase
          .from('pm_project_activities')
          .insert(rows)
          .select('id');
        if (error) throw error;

        // Register as a schedule version via client service
        try {
          const existing = await ScheduleVersionService.list(projectId);
          const vType = existing.length === 0 ? 'baseline' : 'update';
          const ver = await ScheduleVersionService.createVersionForImport(projectId, {
            versionType: vType as 'baseline' | 'update',
            title: vType === 'baseline' ? (isAr ? 'الجدول الزمني لخط الأساس' : 'Baseline Schedule') : (isAr ? `تحديث دوري — ${parsedMeta?.fileName || 'ملف بريمافيرا'}` : `Update — ${parsedMeta?.fileName || 'XER'}`),
            fileName: parsedMeta?.fileName || 'XER',
            activityIds: (inserted || []).map((r) => r.id),
          });
          if (ver) {
            toast.success(isAr ? `تم التسجيل كإصدار ${vType === 'baseline' ? 'خط الأساس' : 'تحديث دوري'} رقم ${ver.version_no}` : `Registered as ${vType === 'baseline' ? 'Baseline' : 'Update'} v${ver.version_no}`);
            loadVersions(projectId);
          }
        } catch (verErr) {
          console.warn('version registration failed:', verErr);
        }
      }

      setSavedCount(insertedCount);
      appCache.invalidate(CACHE_KEYS.wbs(projectId));
      appCache.invalidate(CACHE_KEYS.planning.activities(projectId));
      toast.success(isAr ? `تم حفظ ${insertedCount} نشاطاً في المشروع بنجاح` : `Saved ${insertedCount} activities to project`);
      const { data } = await supabase
        .from('pm_project_activities')
        .select('id, code, name_ar, planned_start, planned_finish, duration_days, percent_complete, is_critical, is_milestone, total_float_days, schedule_version_id')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('planned_start', { ascending: true })
        .limit(3000);
      setSavedActs((data || []).map((a) => ({
        id: a.id,
        code: a.code || '', name: a.name_ar || (isAr ? 'نشاط' : 'Activity'),
        schedule_version_id: a.schedule_version_id || null,
        start: a.planned_start ? new Date(a.planned_start) : null,
        finish: a.planned_finish ? new Date(a.planned_finish) : null,
        duration: Number(a.duration_days || 0), pct: Number(a.percent_complete || 0),
        critical: !!a.is_critical, milestone: !!a.is_milestone,
        float: a.total_float_days != null ? Number(a.total_float_days) : null,
      })));
    } catch (e: unknown) {
      console.error(e);
      toast.error(isAr ? ('فشل الحفظ: ' + ((e as Error).message || 'خطأ غير معروف')) : ('Save failed: ' + ((e as Error).message || 'Unknown error')));
    } finally {
      setSaving(false);
    }
  };

  const acts: Act[] = useMemo(() => {
    if (parsedActsRef.current) return parsedActsRef.current;
    if (!savedActs) return [];
    if (!selectedVersionId || selectedVersionId === 'all') return savedActs;
    const filtered = savedActs.filter((a) => a.schedule_version_id === selectedVersionId);
    return filtered.length > 0 ? filtered : savedActs;
  }, [savedActs, selectedVersionId]);

  const hasData = acts.length > 0;
  const cutOff = useMemo(() => new Date(dataDate + 'T00:00:00'), [dataDate]);

  /* ════ EVM ENGINE (duration-weighted, per SchedulePro logic) ════ */
  const evm = useMemo(() => {
    if (!hasData) return null;
    const work = acts.filter((a) => !a.milestone && a.start && a.finish && a.duration > 0);

    // BAC = total planned duration-days
    const BAC = work.reduce((s, a) => s + a.duration, 0);
    if (BAC <= 0) return null;

    // PV = Σ duration × plannedFraction(cutOff)  — prorated to cut-off
    let PV = 0;
    work.forEach((a) => { PV += a.duration * plannedFraction(a, cutOff); });

    // EV = Σ duration × pct/100 — earned to date
    const EV = work.reduce((s, a) => s + a.duration * (a.pct / 100), 0);

    const SPI = PV > 0 ? EV / PV : 1;
    const SV = EV - PV;
    const EAC = SPI > 0 ? BAC / SPI : BAC;          // BAC / SPI (schedule-based forecast)
    const pctComplete = (EV / BAC) * 100;
    const plannedPct = (PV / BAC) * 100;

    return { BAC, PV, EV, SPI, SV, EAC, pctComplete, plannedPct };
  }, [acts, hasData, cutOff]);

  /* ════ Schedule Variance % (Actual % - Planned %) ════ */
  const scheduleVariancePct = useMemo(() => {
    if (!evm) return null;
    return Math.round((evm.pctComplete - evm.plannedPct) * 10) / 10;
  }, [evm]);

  /* ════ S-CURVE: PV / EV / Forecast (monthly, prorated) ════ */
  const sCurve = useMemo(() => {
    const work = acts.filter((a) => !a.milestone && a.start && a.finish && a.duration > 0);
    if (work.length < 2) return [];

    const BAC = work.reduce((s, a) => s + a.duration, 0);
    if (BAC <= 0) return [];

    // per-month planned days via linear proration of each activity
    const pvMonth = new Map<number, number>();
    work.forEach((a) => {
      const m0 = toKey(a.start!), m1 = toKey(a.finish!);
      if (m1 <= m0) {
        pvMonth.set(m0, (pvMonth.get(m0) || 0) + a.duration);
      } else {
        const share = a.duration / (m1 - m0 + 1);
        for (let m = m0; m <= m1; m++) pvMonth.set(m, (pvMonth.get(m) || 0) + share);
      }
    });

    // EV: earned days distributed linearly from activity start to min(finish, cutOff)
    const evMonth = new Map<number, number>();
    work.forEach((a) => {
      const earned = a.duration * (a.pct / 100);
      if (earned <= 0 || !a.start) return;
      const evEnd = a.finish! <= cutOff ? a.finish! : cutOff;
      if (evEnd <= a.start) return;
      const m0 = toKey(a.start), m1 = toKey(evEnd);
      if (m1 <= m0) {
        evMonth.set(m0, (evMonth.get(m0) || 0) + earned);
      } else {
        const share = earned / (m1 - m0 + 1);
        for (let m = m0; m <= m1; m++) evMonth.set(m, (evMonth.get(m) || 0) + share);
      }
    });

    const allKeys = [...new Set([...pvMonth.keys(), ...evMonth.keys()])].sort((a, b) => a - b);
    if (!allKeys.length) return [];
    const k0 = allKeys[0], kN = allKeys[allKeys.length - 1];

    const cutKey = toKey(cutOff);
    const points: { label: string; pv: number | null; ev: number | null; forecast: number | null }[] = [];
    let pvAcc = 0, evAcc = 0;

    // remaining work after cut-off, spread over remaining planned months of incomplete activities
    const remMonth = new Map<number, number>();
    work.forEach((a) => {
      const remaining = a.duration * (1 - a.pct / 100);
      if (remaining <= 0 || !a.start || !a.finish) return;
      const effFinish = a.finish! <= cutOff ? null : a.finish!;
      if (!effFinish) return;
      const s = a.start! <= cutOff ? cutOff : a.start!;
      if (s >= effFinish) return;
      const m0 = toKey(s), m1 = toKey(effFinish);
      const share = remaining / (m1 - m0 + 1);
      for (let m = m0; m <= m1; m++) remMonth.set(m, (remMonth.get(m) || 0) + share);
    });

    for (let k = k0; k <= kN; k++) {
      const d = new Date(Math.floor(k / 12), k % 12, 1);
      const label = MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
      pvAcc += pvMonth.get(k) || 0;
      evAcc += evMonth.get(k) || 0;

      const pvPct = (pvAcc / BAC) * 100;
      const evPct = (evAcc / BAC) * 100;

      if (k <= cutKey) {
        points.push({ label, pv: Math.round(pvPct * 10) / 10, ev: Math.round(evPct * 10) / 10, forecast: null });
      } else {
        // forecast: EV at cut-off + remaining planned from remMonth
        let remAcc = 0;
        for (let kk = k; kk <= kN; kk++) remAcc += remMonth.get(kk) || 0;
        // forecast cumulative = EV@cut + remaining days scheduled from this month onward (reversed accumulation)
        let remFromHere = 0;
        for (let kk = k; kk <= kN; kk++) remFromHere += remMonth.get(kk) || 0;
        // remaining total = BAC - evAcc_at_cutoff; approximate: distribute remaining over future months proportionally to remMonth
        points.push({ label, pv: Math.round(pvPct * 10) / 10, ev: null, forecast: null });
      }
    }

    // compute forecast properly: EV@cut + remaining spread over future planned profile
    const evAtCut = points.find((p) => p.ev != null)?.ev ?? 0;
    const remainingTotal = BAC - (evAtCut / 100) * BAC;
    const futureKeys = allKeys.filter((k) => k > cutKey);
    const futureSum = futureKeys.reduce((s, k) => s + (remMonth.get(k) || 0), 0);
    let fcAcc = evAtCut;
    points.forEach((p) => {
      if (p.ev != null) return; // past months
      const k = toKey(new Date(parseInt(p.label.slice(p.label.indexOf(' ') + 1)), MONTHS.indexOf(p.label.split(' ')[0]), 1));
      const share = futureSum > 0 ? (remMonth.get(k) || 0) / futureSum : 0;
      fcAcc += remainingTotal * share;
      p.forecast = Math.round(fcAcc * 10) / 10;
    });

    return points;
  }, [acts, cutOff]);

  /* ════ Monthly histogram: planned vs earned days ════ */
  const monthlyHist = useMemo(() => {
    const work = acts.filter((a) => !a.milestone && a.start && a.finish && a.duration > 0);
    if (!work.length) return [];
    const pvMonth = new Map<number, number>();
    const evMonth = new Map<number, number>();
    work.forEach((a) => {
      const m0 = toKey(a.start!), m1 = toKey(a.finish!);
      if (m1 <= m0) {
        pvMonth.set(m0, (pvMonth.get(m0) || 0) + a.duration);
        if (a.pct > 0) evMonth.set(m0, (evMonth.get(m0) || 0) + a.duration * (a.pct / 100));
      } else {
        const share = a.duration / (m1 - m0 + 1);
        const earned = a.duration * (a.pct / 100);
        const evEnd = a.finish! <= cutOff ? a.finish! : cutOff;
        const evM1 = Math.min(m1, toKey(evEnd));
        for (let m = m0; m <= m1; m++) {
          pvMonth.set(m, (pvMonth.get(m) || 0) + share);
          if (m <= evM1 && a.pct > 0) evMonth.set(m, (evMonth.get(m) || 0) + earned / (m1 - m0 + 1));
        }
      }
    });
    const keys = [...new Set([...pvMonth.keys(), ...evMonth.keys()])].sort((a, b) => a - b);
    return keys.slice(0, 36).map((k) => {
      const d = new Date(Math.floor(k / 12), k % 12, 1);
      return {
        label: MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2),
        planned: Math.round((pvMonth.get(k) || 0) * 10) / 10,
        earned: Math.round((evMonth.get(k) || 0) * 10) / 10,
      };
    });
  }, [acts, cutOff]);

  /* ════ Progress composition ════ */
  const composition = useMemo(() => {
    const done = acts.filter((a) => a.pct >= 100).length;
    const prog = acts.filter((a) => a.pct > 0 && a.pct < 100).length;
    const not = acts.length - done - prog;
    return [
      { name: isAr ? 'منتهية' : 'Completed', value: done },
      { name: isAr ? 'جارية' : 'In Progress', value: prog },
      { name: isAr ? 'لم تبدأ' : 'Not Started', value: not },
    ].filter((x) => x.value > 0);
  }, [acts, isAr]);

  /* ════ Delay analysis (vs cut-off) ════ */
  const delays = useMemo(() => {
    return acts
      .filter((a) => !a.milestone && a.finish && a.finish < cutOff && a.pct < 100)
      .map((a) => ({
        ...a,
        lateDays: Math.round((cutOff.getTime() - a.finish!.getTime()) / DAY),
      }))
      .sort((a, b) => b.lateDays - a.lateDays)
      .slice(0, 15);
  }, [acts, cutOff]);

  /* ════ Look-ahead ════ */
  const lookAhead = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in60 = new Date(today.getTime() + 60 * DAY);
    return acts
      .filter((a) => a.start && a.start >= today && a.start <= in60 && !a.milestone)
      .sort((a, b) => a.start!.getTime() - b.start!.getTime())
      .slice(0, 12);
  }, [acts]);

  const kpis = useMemo(() => {
    if (!hasData) return null;
    const critical = acts.filter((a) => a.critical).length;
    const milestones = acts.filter((a) => a.milestone).length;
    return { total: acts.length, critical, milestones };
  }, [acts, hasData]);

  return (
    <div className="p-4 md:p-6 space-y-5 w-full text-start" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 ring-1 ring-white/20 shrink-0">
            <GanttChartSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'الجدول الزمني وخط الأساس' : 'Project Schedule & Baseline'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold">
                {isAr ? 'المسار الحرج والقيمة المكتسبة' : 'CPM & EVM'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة المخطط الزمني الشامل · تحليل المسار الحرج · قياس القيمة المكتسبة · اعتماد خط الأساس'
                : 'Primavera XER · Gantt · S-Curve · EVM · DCMA 14-Point'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80">
          {/* Data date control */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
            <label htmlFor="baseline-data-date" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer">
              {isAr ? 'تاريخ الاستخراج:' : 'Data Date:'}
            </label>
            <input
              id="baseline-data-date"
              aria-label={isAr ? "تاريخ اعتماد البيانات" : "Data Date"}
              type="date"
              value={dataDate}
              onChange={(e) => setDataDate(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 rounded px-1"
              title={isAr ? "تاريخ استخراج البيانات — يفصل بين المخطط والمنجز الفعلي" : "Data Date — cut-off date separating planned from earned"}
            />
          </div>

          {/* Project select */}
          <div className="relative">
            <label htmlFor="baseline-project-select" className="sr-only">
              {isAr ? 'اختر المشروع' : 'Select Project'}
            </label>
            <select
              id="baseline-project-select"
              aria-label={isAr ? "اختر المشروع" : "Select Project"}
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer min-w-[200px] max-w-[260px] shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            >
              <option value="">{isAr ? '— اختر المشروع —' : '— Select Project —'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upload XER */}
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label={isAr ? "استيراد ملف بريمافيرا" : "Upload Primavera XER"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shrink-0 shadow-sm shadow-emerald-700/20 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{parsing ? (isAr ? 'جارٍ التحليل…' : 'Parsing…') : (isAr ? 'استيراد بريمافيرا' : 'Upload XER')}</span>
              </button>
              <input
                ref={fileRef}
                id="baseline-file-upload"
                aria-label={isAr ? "اختيار ملف بريمافيرا" : "Select Primavera XER file"}
                type="file"
                accept=".xer"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </>
          )}

          {/* Pulse Studio button */}
          <button
            type="button"
            onClick={() => setViewTab('pulse')}
            aria-label={isAr ? "فتح استوديو نبض الجدول الزمني" : "Open Schedule Pulse Studio"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold shadow-sm shadow-teal-700/20 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title={isAr ? 'فتح استوديو نبض الجدول الزمني' : 'Open Schedule Pulse Studio'}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
            <span>{isAr ? 'استوديو النبض' : 'Pulse Studio'}</span>
          </button>

          {/* Actions for reports */}
          {hasData && (
            <>
              <button
                type="button"
                onClick={printReport}
                aria-label={isAr ? "طباعة التقرير التنفيذي أو حفظه بتنسيق PDF" : "Print executive report or save as PDF"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer shrink-0 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                title={isAr ? "طباعة التقرير التنفيذي أو حفظه كـ PDF" : "Executive report — Print / PDF"}
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'تقرير تنفيذي PDF' : 'PDF Report'}</span>
              </button>
              <button
                type="button"
                onClick={exportCSV}
                aria-label={isAr ? "تصدير جدول الأنشطة إلى إكسل" : "Export activities as CSV"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer shrink-0 hover:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all shadow-sm"
                title={isAr ? "تصدير جدول الأنشطة (ملف إكسل CSV)" : "Export activities CSV (opens in Excel)"}
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span>{isAr ? 'تصدير إكسل' : 'CSV Export'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Parse banner */}
      {parsedMeta && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {parsedMeta.fileName}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {parsedMeta.count} {isAr ? 'نشاط' : 'activities'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {parsedMeta.deps} {isAr ? 'علاقة منطقية' : 'dependencies'}
            </span>
          </div>
          {canEdit && projectId && savedCount == null && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              {isAr ? 'حفظ في المشروع' : 'Save to Project'}
            </button>
          )}
          {savedCount != null && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? `تم حفظ ${savedCount} نشاطاً` : `Saved ${savedCount} activities`}
            </span>
          )}
        </div>
      )}

      {/* Saving progress indicator */}
      {saving && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 shadow-sm" role="status" aria-live="polite">
          <span className="flex items-center gap-2 font-bold">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            {isAr ? 'جارٍ حفظ الأنشطة والربط مع شجرة WBS وتسجيل النسخة…' : 'Saving activities, linking to WBS, and registering version…'}
          </span>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loadingSaved && (
        <div className="space-y-4 animate-pulse" aria-busy="true" aria-label={isAr ? "جارٍ تحميل بيانات الجدول الزمني…" : "Loading schedule data…"}>
          {/* Skeleton Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          {/* Skeleton KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
          {/* Skeleton Main Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 flex-1 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Universal Tab Navigation Bar ── */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3" role="tablist" aria-label={isAr ? "خيارات عرض الجدول الزمني" : "Schedule view tabs"}>
        <button
          type="button"
          role="tab"
          id="tab-pulse"
          aria-selected={viewTab === 'pulse'}
          aria-controls="panel-pulse"
          onClick={() => setViewTab('pulse')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            viewTab === 'pulse'
              ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-700/25 ring-1 ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
          <span>{isAr ? 'استوديو نبض الجدول' : 'Schedule Pulse Studio'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono font-black">
            {isAr ? 'احترافي' : 'PRO'}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-gantt"
          aria-selected={viewTab === 'gantt'}
          aria-controls="panel-gantt"
          onClick={() => setViewTab('gantt')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            viewTab === 'gantt'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'مخطط جانت البياني' : 'Gantt Chart'}</span>
          {hasData && <span className="opacity-75 text-[10px]">({acts.length})</span>}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-graph"
          aria-selected={viewTab === 'graph'}
          aria-controls="panel-graph"
          onClick={() => setViewTab('graph')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            viewTab === 'graph'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'شبكة العلاقات المنطقية' : 'CPM Network Graph'}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-analytics"
          aria-selected={viewTab === 'analytics'}
          aria-controls="panel-analytics"
          onClick={() => setViewTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            viewTab === 'analytics'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'المنحنى التراكمي والتحليلات' : 'S-Curve & Analytics'}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-reports"
          aria-selected={viewTab === 'reports'}
          aria-controls="panel-reports"
          onClick={() => setViewTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            viewTab === 'reports'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'إصدارات الجدول والتقارير الأسبوعية' : 'Versions & Reports'}</span>
          {versions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold">
              {versions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── SCHEDULE PULSE STUDIO PANEL ── */}
      {viewTab === 'pulse' && (
        <div role="tabpanel" id="panel-pulse" aria-labelledby="tab-pulse" className="pt-2">
          <SchedulePulseView
            projectId={projectId}
            projectName={projects.find((p) => p.id === projectId)?.label}
            activities={acts}
            dependencies={parsedDepsRef.current}
            dataDate={dataDate}
            onActivitiesCommitted={
              canEdit
                ? () => {
                    reloadSaved();
                    if (projectId) loadVersions(projectId);
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* ── REPORTS & VERSION COMPARISON PANEL ── */}
      {viewTab === 'reports' && (
        <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports" className="space-y-4 pt-2">
          {/* Interactive Versions Picker Ribbon */}
          {versions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'إصدارات الجدول الزمني المسجلة:' : 'Recorded Schedule Versions:'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVersionId('all')}
                aria-pressed={selectedVersionId === 'all'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  selectedVersionId === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                {selectedVersionId === 'all' && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{isAr ? 'الكل (الأنشطة الحالية)' : 'All (Current Activities)'}</span>
                <span className="opacity-75 text-[10px]">({savedActs?.length ?? 0})</span>
              </button>
              {versions.map((v) => {
                const isSelected = selectedVersionId === v.id;
                const isRef = isReferenceVersion(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVersionId(isSelected ? 'all' : v.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-sm ' + (
                            v.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                              : 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white'
                          )
                        : v.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400'
                        : v.status === 'submitted'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:border-amber-400'
                        : v.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 hover:border-rose-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                    title={`${v.title || ''} — ${v.activities_count || 0} ${isAr ? 'نشاط' : 'activities'}${v.data_date ? ` — ${isAr ? 'تاريخ البيانات:' : 'Data Date:'} ${v.data_date}` : ''}${v.status === 'approved' ? (isAr ? ' — النسخة المرجعية المعتمدة' : ' — Approved Baseline') : ''}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{v.version_type === 'baseline' ? '📌' : v.version_type === 'update' ? '🔄' : '📊'} v{v.version_no}</span>
                    <span className="opacity-80 text-[10px]">
                      {v.version_type === 'baseline' ? (isAr ? 'أساس' : 'Baseline') : v.version_type === 'update' ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'تقرير' : 'Report')}
                    </span>
                    <span className="opacity-60 text-[10px]">({v.activities_count || 0})</span>
                    {isRef && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">{isAr ? 'المرجع' : 'Ref'}</span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${
                      v.status === 'approved' ? 'bg-emerald-500' : v.status === 'submitted' ? 'bg-amber-500' : v.status === 'rejected' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  </button>
                );
              })}
              {canEdit && (
                <BaselineVersionActions versions={versions} onRefetch={() => projectId && loadVersions(projectId)} />
              )}
            </div>
          )}

          {projectId ? (
            <>
              {canEdit && (
                <ScheduleCompareTools projectId={projectId} onVersionsChanged={() => loadVersions(projectId)} />
              )}
              <WeeklyReportsPanel projectId={projectId} />
            </>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-14 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {isAr ? 'اختر مشروعاً لمعاينة التقارير ومقارنة النسخ' : 'Select a project to view reports and compare versions'}
              </h3>
            </div>
          )}
        </div>
      )}

      {/* ── GANTT / GRAPH / ANALYTICS EMPTY STATES ── */}
      {viewTab !== 'pulse' && viewTab !== 'reports' && (
        <>
          {!projectId && !loadingSaved && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-14 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {isAr ? 'اختر مشروعاً أو قم باستيراد ملف بريمافيرا' : 'Select a project or upload a Primavera file'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isAr ? 'المشاريع المحفوظة تظهر بياناتها وتحليلاتها تلقائياً — أو قم باستيراد ملف جدول جديد' : 'Saved projects show analyses immediately — or upload a new schedule file'}
              </p>
            </div>
          )}

          {projectId && !loadingSaved && !hasData && !parsedMeta && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-14 text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {isAr ? 'لا توجد أنشطة محفوظة لهذا المشروع' : 'No activities saved for this project'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isAr ? 'استورد ملف الجدول الزمني من الزر بأعلى الصفحة، أو افتح استوديو نبض الجدول مباشرة' : 'Upload a schedule file from the top button, or open Pulse Studio directly'}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setViewTab('pulse')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                  <span>{isAr ? 'فتح استوديو نبض الجدول الزمني' : 'Open Schedule Pulse Studio'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {hasData && kpis && viewTab !== 'pulse' && viewTab !== 'reports' && (
        <>
          {/* Interactive Versions Picker Ribbon for Gantt/Graph/Analytics */}
          {versions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'إصدارات الجدول الزمني:' : 'Schedule Versions:'}</span>
              </div>

              {/* All active activities button */}
              <button
                type="button"
                onClick={() => setSelectedVersionId('all')}
                aria-pressed={selectedVersionId === 'all'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  selectedVersionId === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                {selectedVersionId === 'all' && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{isAr ? 'الكل (الأنشطة الحالية)' : 'All (Current Activities)'}</span>
                <span className="opacity-75 text-[10px]">({savedActs?.length ?? 0})</span>
              </button>

              {/* Version chips as selectable buttons */}
              {versions.map((v) => {
                const isSelected = selectedVersionId === v.id;
                const isRef = isReferenceVersion(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVersionId(isSelected ? 'all' : v.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-sm ' + (
                            v.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                              : 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white'
                          )
                        : v.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400'
                        : v.status === 'submitted'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:border-amber-400'
                        : v.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 hover:border-rose-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                    title={`${v.title || ''} — ${v.activities_count || 0} ${isAr ? 'نشاط' : 'activities'}${v.data_date ? ` — ${isAr ? 'تاريخ البيانات:' : 'Data Date:'} ${v.data_date}` : ''}${v.status === 'approved' ? (isAr ? ' — النسخة المرجعية المعتمدة' : ' — Approved Baseline') : ''}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{v.version_type === 'baseline' ? '📌' : v.version_type === 'update' ? '🔄' : '📊'} v{v.version_no}</span>
                    <span className="opacity-80 text-[10px]">
                      {v.version_type === 'baseline' ? (isAr ? 'أساس' : 'Baseline') : v.version_type === 'update' ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'تقرير' : 'Report')}
                    </span>
                    <span className="opacity-60 text-[10px]">({v.activities_count || 0})</span>
                    {isRef && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">{isAr ? 'المرجع' : 'Ref'}</span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${
                      v.status === 'approved' ? 'bg-emerald-500' : v.status === 'submitted' ? 'bg-amber-500' : v.status === 'rejected' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  </button>
                );
              })}
              {canEdit && (
                <BaselineVersionActions versions={versions} onRefetch={() => projectId && loadVersions(projectId)} />
              )}
            </div>
          )}

          {/* Selected Version Indicator Banner */}
          {selectedVersionId !== 'all' && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isAr
                  ? `تتم حالياً معاينة أنشطة الإصدار رقم ${versions.find((v) => v.id === selectedVersionId)?.version_no} (${acts.length} نشاط معروض)`
                  : `Previewing activities for version ${versions.find((v) => v.id === selectedVersionId)?.version_no} (${acts.length} activities shown)`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedVersionId('all')}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                {isAr ? 'عرض كل الأنشطة الحالية' : 'View all active activities'}
              </button>
            </div>
          )}

          {/* 6 Comparison KPI Cards with Variance Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: isAr ? 'إجمالي الأنشطة' : 'Total Activities', value: fmtEGP(kpis.total), sub: isAr ? 'نشاط في الجدول' : 'activities in schedule', icon: Table2, tone: 'text-emerald-500' },
              { label: isAr ? 'المسار الحرج' : 'Critical Path', value: fmtEGP(kpis.critical), sub: `${kpis.total > 0 ? Math.round((kpis.critical / kpis.total) * 100) : 0}% ${isAr ? 'من الأنشطة' : 'of activities'}`, icon: AlertTriangle, tone: 'text-rose-500' },
              { label: isAr ? 'المعالم الرئيسية' : 'Milestones', value: fmtEGP(kpis.milestones), sub: isAr ? 'نقاط فارقة رئيسية' : 'key milestones', icon: CheckCircle2, tone: 'text-purple-500' },
              { label: isAr ? 'القيمة المكتسبة فعلياً' : 'Earned Value (EV)', value: `${Math.round(evm?.pctComplete ?? 0)}%`, sub: isAr ? `من إجمالي ${fmtEGP(evm?.BAC ?? 0)} يوم` : `of ${fmtEGP(evm?.BAC ?? 0)} days BAC`, icon: Gauge, tone: 'text-emerald-500' },
              { label: isAr ? 'نسبة الإنجاز المخطط' : 'Planned Value (PV)', value: `${Math.round(evm?.plannedPct ?? 0)}%`, sub: `${isAr ? 'تاريخ الاستخراج:' : 'Data Date:'} ${fmtD(cutOff)}`, icon: CalendarClock, tone: 'text-blue-500' },
              {
                label: isAr ? 'انحراف الإنجاز الزمني' : 'Schedule Variance %',
                value: scheduleVariancePct == null ? '—' : `${scheduleVariancePct > 0 ? '+' : ''}${scheduleVariancePct}%`,
                sub: scheduleVariancePct == null ? (isAr ? 'لا توجد بيانات' : 'No data') : scheduleVariancePct > 0 ? (isAr ? 'متقدم عن المخطط' : 'Ahead of schedule') : scheduleVariancePct < 0 ? (isAr ? 'متأخر عن المخطط' : 'Behind schedule') : (isAr ? 'مطابق تماماً' : 'On track'),
                icon: scheduleVariancePct == null ? Gauge : scheduleVariancePct > 0 ? TrendingUp : scheduleVariancePct < 0 ? TrendingDown : CheckCircle2,
                tone: scheduleVariancePct == null ? 'text-slate-400 dark:text-slate-500' : scheduleVariancePct > 0 ? 'text-emerald-600 dark:text-emerald-400' : scheduleVariancePct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400',
                cardBorder: scheduleVariancePct == null ? '' : scheduleVariancePct > 0 ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20' : scheduleVariancePct < 0 ? 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20' : 'border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20',
              },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl border p-3.5 transition-all shadow-sm ${k.cardBorder ? k.cardBorder : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{k.label}</span>
                  <k.icon className={`w-4 h-4 shrink-0 ${k.tone}`} aria-hidden="true" />
                </div>
                <div className="mt-1 text-lg font-black text-slate-900 dark:text-white tabular-nums">{k.value}</div>
                {k.sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* ── GANTT PANEL ── */}
          {viewTab === 'gantt' && (
            <div role="tabpanel" id="panel-gantt" aria-labelledby="tab-gantt">
              <GanttChart activities={acts} projectId={canEdit ? projectId : ''} />
            </div>
          )}

          {/* ── GRAPH (CPM NETWORK) PANEL ── */}
          {viewTab === 'graph' && (
            <div role="tabpanel" id="panel-graph" aria-labelledby="tab-graph">
              <CPMNetworkGraph
                activities={acts}
                projectId={projectId}
                dependencies={parsedDepsRef.current}
              />
            </div>
          )}

          {/* ── ANALYTICS PANEL ── */}
          {viewTab === 'analytics' && (
            <div role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics" className="space-y-4">
              {/* Enhanced EVM Tiles */}
              {evm && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: isAr ? 'إجمالي أيام العمل المخططة' : 'Budget at Completion (BAC)', sub: isAr ? 'إجمالي أيام العمل المقررة' : 'Total Planned Days', value: `${fmtEGP(evm.BAC)} ${isAr ? 'يوم' : 'd'}`, tone: 'text-slate-700 dark:text-slate-200', bg: 'bg-white dark:bg-slate-900' },
                    { label: isAr ? 'القيمة المخططة حتى التاريخ' : 'Planned Value (PV)', sub: isAr ? 'المفترض إنجازه حتى الآن' : 'Scheduled to Date', value: `${fmtEGP(evm.PV)} ${isAr ? 'يوم' : 'd'}`, tone: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/40 dark:bg-blue-950/20' },
                    { label: isAr ? 'القيمة المكتسبة المحققة' : 'Earned Value (EV)', sub: isAr ? 'المنجز الفعلي حتى الآن' : 'Earned to Date', value: `${fmtEGP(evm.EV)} ${isAr ? 'يوم' : 'd'}`, tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/40 dark:bg-emerald-950/20' },
                    {
                      label: isAr ? 'مؤشر كفاءة الأداء الزمني' : 'Schedule Performance (SPI)',
                      sub: evm.SPI >= 1 ? (isAr ? 'معدل إنجاز منتظم (≥ 1)' : 'Good Performance (≥ 1)') : (isAr ? 'معدل إنجاز بطيء (< 1)' : 'Slow Performance (< 1)'),
                      value: evm.SPI.toFixed(2),
                      tone: evm.SPI >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                      bg: evm.SPI >= 1 ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : 'bg-rose-50/50 dark:bg-rose-950/30',
                    },
                    {
                      label: isAr ? 'تباين الجدول الزمني' : 'Schedule Variance (SV)',
                      sub: evm.SV > 0 ? (isAr ? 'متقدم عن المخطط' : 'Ahead') : evm.SV < 0 ? (isAr ? 'عجز زمني متراكم' : 'Behind') : (isAr ? 'مطابق للجدول' : 'On Schedule'),
                      value: `${evm.SV > 0 ? '+' : ''}${fmtEGP(evm.SV)} ${isAr ? 'يوم' : 'd'}`,
                      tone: evm.SV >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                      bg: evm.SV >= 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : 'bg-rose-50/50 dark:bg-rose-950/30',
                    },
                    { label: isAr ? 'المدة التقديرية الكلية' : 'Estimate at Completion (EAC)', sub: isAr ? 'توقع نهاية المشروع' : 'Forecasted Total Days', value: `${fmtEGP(evm.EAC)} ${isAr ? 'يوم' : 'd'}`, tone: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50/40 dark:bg-orange-950/20' },
                  ].map((k) => (
                    <div key={k.label} className={`rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 transition-all shadow-sm ${k.bg}`}>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{k.label}</div>
                      <div className={`mt-1 text-lg font-black tabular-nums ${k.tone}`}>{k.value}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{k.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* S-Curve PV/EV/Forecast */}
              {sCurve.length > 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'المنحنى التراكمي للإنجاز — مخطط / منجز / متوقع' : 'S-Curve — Planned / Actual / Forecast'}
                    </h2>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#2e75b6] inline-block" />{isAr ? 'مخطط' : 'Planned'}</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#2e9e4a] inline-block" />{isAr ? 'منجز' : 'Earned'}</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#e8852b] inline-block" />{isAr ? 'متوقع' : 'Forecast'}</span>
                    </div>
                  </div>
                  <div className="h-72" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
                        <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} unit="%" width={40} domain={[0, 100]} />
                        <Tooltip formatter={(v, n) => [`${v}%`, n === 'pv' ? (isAr ? 'مخطط' : 'Planned') : n === 'ev' ? (isAr ? 'منجز' : 'Earned') : (isAr ? 'متوقع' : 'Forecast')]} contentStyle={{ fontSize: 11, borderRadius: 8, direction: isAr ? 'rtl' : 'ltr' }} />
                        <ReferenceLine x={sCurve.find((p) => p.ev != null)?.label} stroke="#e8852b" strokeDasharray="4 4" label={{ value: isAr ? 'تاريخ الاستخراج' : 'Data Date', fontSize: 9, fill: '#e8852b' }} />
                        <Line type="monotone" dataKey="pv" stroke="#2e75b6" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="ev" stroke="#2e9e4a" strokeWidth={2.5} dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="forecast" stroke="#e8852b" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Histogram + composition */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {monthlyHist.length > 1 && (
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'التوزيع التكراري الشهري — الأيام المخططة مقارنة بالمنجزة' : 'Monthly Distribution — Planned vs Earned'}
                    </h2>
                    <div className="h-56" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyHist} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10 }} width={32} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, direction: isAr ? 'rtl' : 'ltr' }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="planned" name={isAr ? 'مخطط' : 'Planned'} fill="#2e75b6" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="earned" name={isAr ? 'منجز' : 'Earned'} fill="#2e9e4a" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {composition.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-3">
                      <PieIcon className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'توزيع حالات الأنشطة' : 'Activity Status Distribution'}
                    </h2>
                    <div className="h-56" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={composition} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                            {composition.map((_, i) => <Cell key={i} fill={['#2e9e4a', '#2e75b6', '#94a3b8'][i % 3]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, direction: isAr ? 'rtl' : 'ltr' }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Delay analysis */}
              {delays.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      {isAr ? 'تحليل التأخير — أنشطة تجاوزت تاريخ نهايتها المخطط ولم تكتمل' : 'Delay Analysis — Incomplete activities past planned finish'}
                    </h2>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {isAr ? `حتى ${fmtD(cutOff)}` : `As of ${fmtD(cutOff)}`}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start min-w-[560px]" dir={isAr ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 text-[10px]">
                          <th className="px-4 py-2 font-bold text-start">{isAr ? 'كود النشاط' : 'Code'}</th>
                          <th className="px-3 py-2 font-bold text-start">{isAr ? 'اسم النشاط' : 'Activity Name'}</th>
                          <th className="px-3 py-2 font-bold text-start">{isAr ? 'تاريخ الانتهاء المخطط' : 'Planned Finish'}</th>
                          <th className="px-3 py-2 font-bold text-center">{isAr ? 'مدة التأخير' : 'Delay Duration'}</th>
                          <th className="px-3 py-2 font-bold text-center">{isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {delays.map((a, i) => (
                          <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">{a.code || '—'}</td>
                            <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 truncate max-w-[280px]" title={a.name}>{a.name}</td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[10px]">
                              <span dir="ltr" className="tabular-nums font-mono">{fmtD(a.finish)}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-[10px] font-black">
                                <span dir="ltr">+{a.lateDays} {isAr ? 'يوم' : 'd'}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, a.pct))}%` }} />
                                </div>
                                <span className="text-[10px] font-bold">{Math.round(a.pct)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Look-ahead */}
              {lookAhead.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Telescope className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'الأنشطة المستقبلية — تبدأ خلال 60 يوماً' : 'Look-Ahead — Starts within 60 days'}
                    </h2>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {lookAhead.length} {isAr ? 'نشاط' : 'activities'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start min-w-[560px]" dir={isAr ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 text-[10px]">
                          <th className="px-4 py-2 font-bold text-start">{isAr ? 'كود النشاط' : 'Code'}</th>
                          <th className="px-3 py-2 font-bold text-start">{isAr ? 'اسم النشاط' : 'Activity Name'}</th>
                          <th className="px-3 py-2 font-bold text-start">{isAr ? 'تاريخ البدء' : 'Start Date'}</th>
                          <th className="px-3 py-2 font-bold text-start">{isAr ? 'تاريخ الانتهاء' : 'Finish Date'}</th>
                          <th className="px-3 py-2 font-bold text-center">{isAr ? 'المدة المخططة' : 'Planned Duration'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {lookAhead.map((a, i) => (
                          <tr key={i} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${a.critical ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                            <td className="px-4 py-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">{a.code || '—'}</td>
                            <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 truncate max-w-[300px]" title={a.name}>{a.name}</td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[10px]">
                              <span dir="ltr" className="tabular-nums font-mono">{fmtD(a.start)}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[10px]">
                              <span dir="ltr" className="tabular-nums font-mono">{fmtD(a.finish)}</span>
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400">
                              <span dir="ltr">{a.duration} {isAr ? 'يوم' : 'd'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DCMA — from fresh parse only */}
          {parsedMeta && viewTab === 'analytics' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-3">
                <Table2 className="w-4 h-4 text-emerald-500" />
                {isAr ? 'مؤشرات جودة الجدول الزمني (معايير الجودة الـ 14)' : 'Schedule Quality Check (DCMA 14-Point)'}
                <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500">
                  {isAr ? '(يتم احتسابها تلقائياً بعد استيراد ملف الجدول مباشرة)' : '(Evaluated immediately after schedule file import)'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                {parsedMeta.dcma.map((m) => (
                  <div key={m.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      {m.status === 'pass' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${m.status === 'warn' ? 'text-amber-500' : 'text-rose-500'}`} />
                      )}
                      <span className="text-slate-500 dark:text-slate-400 truncate">{m.name}</span>
                    </span>
                    <span className={`font-bold tabular-nums shrink-0 ${
                      m.status === 'pass' ? 'text-emerald-600 dark:text-emerald-400'
                      : m.status === 'warn' ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {m.percentage != null ? `${m.value} (${Math.round(m.percentage * 10) / 10}%)` : m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center">
        <Link href="/planning" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer">
          {isAr ? 'الرجوع إلى لوحة إدارة التخطيط' : 'Back to Planning Dashboard'} <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    </div>
  );
}
