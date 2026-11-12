'use client';

/**
 * LibraryTaskGenerator — توليد مهام موقع من خطوات التنفيذ القياسية
 * ---------------------------------------------------------------
 * اختيار: مشروع + مكوّن (بحيرة/غرفة/غرفة+خزان) → معاينة (الجديد/الموجود)
 * → زرار توليد ينشئ pm_site_tasks بحالة pending.
 * التكرار آمن: الخطوات المولدة سابقًا بتتخطى بالعنوان `[LB-014] …`.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '@/lib/services/project.service';
import { supabase } from '@/lib/supabase';
import {
  ActivityLibraryGenerationService,
  LibraryComponentType,
  GenerationPreview,
} from '@/lib/services/activity-library-generation.service';
import { COMPONENT_LABELS } from '@/types/planning';
import { toast } from 'sonner';
import { Wand2, Loader2, FolderKanban, Layers, UserPlus } from 'lucide-react';
import { logger } from '@/lib/logger';

interface StakeholderRow {
  stakeholder_id: string;
  stakeholder_name_ar: string | null;
  project_role: string | null;
  raci_role: string | null;
}

interface StakeholderOption {
  id: string;
  name_ar: string | null;
  name?: string;
  project_role: string | null;
  raci_role: string | null;
}

const COMPONENTS: { key: LibraryComponentType; label: string }[] = (
  Object.keys(COMPONENT_LABELS) as LibraryComponentType[]
).map((k) => ({ key: k, label: COMPONENT_LABELS[k] }));

export const LibraryTaskGenerator: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [componentType, setComponentType] = useState<LibraryComponentType | ''>('');
  const [componentInstanceId, setComponentInstanceId] = useState('');
  const [componentInstances, setComponentInstances] = useState<{ id: string; code: string; name_ar: string; component_type: string }[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [qcId, setQcId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [preview, setPreview] = useState<GenerationPreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [zones, setZones] = useState<{ id: string; name_ar: string | null }[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderOption[]>([]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-generator'],
    queryFn: () => ProjectService.getProjects(),
  });

  useEffect(() => {
    if (!projectId) {
      setZones([]);
      setComponentInstances([]);
      setComponentInstanceId('');
      return;
    }
    let alive = true;
    supabase
      .from('pm_zones')
      .select('id, name_ar')
      .eq('project_id', projectId)
      .order('sort_order')
      .then(({ data }) => {
        if (alive) setZones((data || []) as { id: string; name_ar: string | null }[]);
      });

    supabase
      .from('pm_component_instances')
      .select('id, code, name_ar, component_type')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .order('code')
      .then(({ data }) => {
        if (alive) setComponentInstances((data || []) as { id: string; code: string; name_ar: string; component_type: string }[]);
      });

    return () => {
      alive = false;
    };
  }, [projectId]);

  // Load project team members (scoped to selected project)
  useEffect(() => {
    if (!projectId) { setStakeholders([]); setAssigneeId(''); setQcId(''); return; }
    let alive = true;
    supabase
      .from('project_team_with_auth')
      .select('stakeholder_id, stakeholder_name_ar, project_role, raci_role')
      .eq('project_id', projectId)
      .eq('stakeholder_active', true)
      .then(({ data }) => {
        if (!alive) return;
        const members = (data || []).map((d: StakeholderRow) => ({
          id: d.stakeholder_id,
          name_ar: d.stakeholder_name_ar,
          project_role: d.project_role,
          raci_role: d.raci_role,
        }));
        setStakeholders(members);

        // Auto-default: site_engineer as assignee, qc_engineer as QC
        const siteEng = members.find((m) =>
          m.project_role?.toLowerCase()?.includes('site') && m.raci_role === 'responsible'
        );
        const qcEng = members.find((m) =>
          m.project_role?.toLowerCase()?.includes('qc') || m.project_role?.toLowerCase()?.includes('quality')
        );
        if (siteEng && !assigneeId) setAssigneeId(siteEng.id);
        if (qcEng && !qcId) setQcId(qcEng.id);
      });
    return () => { alive = false; };
  }, [projectId]);

  useEffect(() => {
    setPreview(null);
  }, [projectId, componentType, componentInstanceId, zoneId]);

  const ready = useMemo(() => Boolean(projectId && componentType), [projectId, componentType]);

  const selectedCompInst = useMemo(
    () => componentInstances.find((c) => c.id === componentInstanceId),
    [componentInstances, componentInstanceId]
  );

  const loadPreview = async () => {
    if (!ready) return;
    try {
      setPreview(
        await ActivityLibraryGenerationService.preview(
          projectId,
          componentType as LibraryComponentType,
          componentInstanceId || null,
          zoneId || null
        )
      );
    } catch (e) {
      logger.error('Failed to preview activity library tasks', { detail: e });
      toast.error('فشل حساب المعاينة');
    }
  };

  const generate = async () => {
    if (!ready || generating) return;
    setGenerating(true);
    try {
      const res = await ActivityLibraryGenerationService.generate({
        projectId,
        componentType: componentType as LibraryComponentType,
        componentInstanceId: componentInstanceId || null,
        componentInstanceName: selectedCompInst?.name_ar || null,
        zoneId: zoneId || null,
        defaultAssigneeStakeholderId: assigneeId || null,
        defaultQcStakeholderId: qcId || null,
        startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
      });
      toast.success(`تم إنشاء ${res.created} مهمة${res.skipped ? ` · تم تخطي ${res.skipped} موجودة` : ''}`);
      setPreview(
        await ActivityLibraryGenerationService.preview(
          projectId,
          componentType as LibraryComponentType,
          componentInstanceId || null,
          zoneId || null
        )
      );
    } catch (e: unknown) {
      logger.error('Failed to generate activity library tasks', { detail: e });
      toast.error((e as { message?: string } | null)?.message || 'فشل التوليد');
    } finally {
      setGenerating(false);
    }
  };

  const sel =
    'px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-emerald-500" />
        <h3 className="text-xs font-black text-slate-800 dark:text-white">توليد مهام موقع من المكتبة</h3>
      </div>

      {/* No team warning */}
      {projectId && stakeholders.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>⚠️ لا يوجد فريق عمل لهذا المشروع — أضف أعضاء الفريق من تبويب &quot;الفريق&quot; في إعداد المشروع أولاً</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">المشروع *</label>
          <div className="relative">
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setZoneId(''); }} className={`${sel} w-full pe-9`}>
              <option value="">— اختر مشروع —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{(p as { project_name?: string }).project_name || p.name_ar}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">نوع المكوّن *</label>
          <div className="relative">
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select value={componentType} onChange={(e) => setComponentType(e.target.value as LibraryComponentType | '')} className={`${sel} w-full pe-9`}>
              <option value="">— اختر نوع مكوّن —</option>
              {COMPONENTS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">المكوّن المادي (اختياري)</label>
          <select
            value={componentInstanceId}
            onChange={(e) => setComponentInstanceId(e.target.value)}
            disabled={!projectId}
            className={`${sel} w-full disabled:opacity-50 font-mono`}
          >
            <option value="">— عام بدون تخصيص وحدة —</option>
            {componentInstances.map((ci) => (
              <option key={ci.id} value={ci.id}>
                {ci.code} — {ci.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">المنطقة (اختياري)</label>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} disabled={!projectId} className={`${sel} w-full disabled:opacity-50`}>
            <option value="">بدون ربط بمنطقة</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name_ar || z.id.slice(0, 8)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">مهندس الموقع (المسؤول)</label>
          <div className="relative">
            <UserPlus className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={`${sel} w-full pe-9`}>
              <option value="">بدون تعيين</option>
              {stakeholders.map((s) => (
                <option key={s.id} value={s.id}>{s.name_ar || s.name}{s.project_role ? ` (${s.project_role})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">مهندس الجودة / الاستلام (QC)</label>
          <div className="relative">
            <UserPlus className="w-3.5 h-3.5 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select value={qcId} onChange={(e) => setQcId(e.target.value)} className={`${sel} w-full pe-9`}>
              <option value="">بدون تعيين QC</option>
              {stakeholders.map((s) => (
                <option key={s.id} value={s.id}>{s.name_ar || s.name}{s.project_role ? ` (${s.project_role})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={loadPreview}
          disabled={!ready}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          معاينة قبل التنفيذ
        </button>
        <button
          onClick={generate}
          disabled={!ready || generating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          توليد المهام
        </button>
        {ready && (
          <span className="text-[11px] text-slate-400">
            الخطوات المولدة سابقًا هتتخطى تلقائيًا — التوليد آمن للتكرار
          </span>
        )}
      </div>

      {preview && (
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300">
            إجمالي خطوات المكتبة: <span className="tabular-nums">{preview.totalSteps}</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            هيتم إنشاء: <span className="tabular-nums">{preview.toCreate}</span>
          </span>
          <span className="font-bold text-slate-400">
            موجود مسبقًا (هيتخطى): <span className="tabular-nums">{preview.alreadyGenerated}</span>
          </span>
        </div>
      )}
    </div>
  );
};
