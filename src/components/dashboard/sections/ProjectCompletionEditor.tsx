'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Project } from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

interface Props {
  projects: Project[];
  onUpdated: (id: string, pct: number) => void;
}

export const ProjectCompletionEditor: React.FC<Props> = ({ projects, onUpdated }) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEdit = canEditPath('/projects', roles, isAdmin, dbAccessRules);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const rows = projects.filter((p) =>
    !q ||
    `${p.project_name ?? ''} ${p.project_name_ar ?? ''} ${p.project_code ?? ''}`.toLowerCase().includes(q),
  );

  const save = async (p: Project) => {
    const raw = drafts[p.id];
    const n = Number(raw);
    if (raw === undefined || raw === '' || !Number.isFinite(n) || n < 0 || n > 100) {
      toast.error('أدخل نسبة بين 0 و 100');
      return;
    }
    setSaving(p.id);
    try {
      const saved = await ProjectService.updateProjectCompletion(p.id, n);
      onUpdated(p.id, saved);
      setDrafts((d) => {
        const { [p.id]: _omit, ...rest } = d;
        return rest;
      });
      toast.success('تم تحديث نسبة الإنجاز');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل تحديث نسبة الإنجاز');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section
      data-testid="completion-editor"
      className="rounded-2xl border border-border bg-card p-4 space-y-3"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold">تعديل نسبة الإنجاز للمشاريع</h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث باسم أو كود المشروع"
          aria-label="بحث"
          className="h-8 w-56 rounded-lg border border-border bg-background px-2 text-xs"
        />
      </div>
      {!canEdit && (
        <p className="text-xs text-muted-foreground">عرض فقط — ليس لديك صلاحية التعديل.</p>
      )}
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {rows.length === 0 && <p className="py-4 text-xs text-muted-foreground">لا توجد مشاريع.</p>}
        {rows.map((p) => {
          const current = Number(p.completion_pct ?? 0);
          const draft = drafts[p.id];
          const dirty = draft !== undefined && draft !== String(current);
          return (
            <div key={p.id} className="flex items-center gap-3 py-2 text-xs" data-testid="completion-row">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.project_name_ar || p.project_name}</div>
                <div className="text-[10px] text-muted-foreground">{p.project_code}</div>
              </div>
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, current))}%` }} />
              </div>
              {canEdit ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={draft ?? String(current)}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    aria-label={`نسبة إنجاز ${p.project_name_ar || p.project_name}`}
                    className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-center"
                  />
                  <button
                    type="button"
                    disabled={!dirty || saving === p.id}
                    onClick={() => save(p)}
                    className="h-8 rounded-lg bg-emerald-600 px-3 text-white disabled:opacity-40"
                  >
                    {saving === p.id ? '...' : 'حفظ'}
                  </button>
                </>
              ) : (
                <span className="w-20 text-center font-bold"><bdi>{current}%</bdi></span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export { ProjectCompletionEditorSkeleton } from '../DashboardSkeletons';

