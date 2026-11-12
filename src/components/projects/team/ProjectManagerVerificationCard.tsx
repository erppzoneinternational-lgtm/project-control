'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ArrowRightLeft, 
  Calendar, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProjectService } from '@/lib/services/project.service';
import { toast } from 'sonner';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

export function isProjectManagerRole(role: string): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  if (
    r.includes('technical office') ||
    r.includes('مكتب فني') ||
    r.includes('planning') ||
    r.includes('تخطيط') ||
    r.includes('construction') ||
    r.includes('تنفيذ') ||
    r.includes('quality') ||
    r.includes('qc') ||
    r.includes('qa') ||
    r.includes('جودة') ||
    r.includes('safety') ||
    r.includes('hse') ||
    r.includes('سلامة') ||
    r.includes('survey') ||
    r.includes('مساحة') ||
    r.includes('commercial') ||
    r.includes('عقود') ||
    r.includes('تجاري')
  ) {
    return false;
  }
  return (
    r === 'project manager' ||
    r === 'senior project manager' ||
    r === 'pm' ||
    r === 'مدير مشروع' ||
    r === 'مدير المشروع' ||
    r === 'مدير مشروعات' ||
    r === 'مدير المشروعات' ||
    r.includes('project manager') ||
    r.includes('مدير مشروع')
  );
}

interface PMHistoryRecord {
  id: string;
  stakeholder_id?: string | null;
  name: string;
  role: string;
  phone?: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  termination_reason?: string | null;
  predecessor_id?: string | null;
}

interface ProjectManagerVerificationCardProps {
  projectId: string;
  projectCode: string;
  projectName: string;
  currentPmStakeholderId?: string | null;
  onUpdated?: () => void;
  isAr?: boolean;
}

export function ProjectManagerVerificationCard({
  projectId,
  projectCode,
  projectName,
  currentPmStakeholderId,
  onUpdated,
  isAr = true
}: ProjectManagerVerificationCardProps) {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEditProject =
    isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<PMHistoryRecord[]>([]);
  const [currentPM, setCurrentPM] = useState<PMHistoryRecord | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Change PM Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableStakeholders, setAvailableStakeholders] = useState<Array<{ id: string; name: string; phone?: string; job_title?: string }>>([]);
  const [selectedNewPmId, setSelectedNewPmId] = useState('');
  const [customNewPmName, setCustomNewPmName] = useState('');
  const [customNewPmPhone, setCustomNewPmPhone] = useState('');
  const [endDateCurrent, setEndDateCurrent] = useState(new Date().toISOString().split('T')[0]);
  const [startDateNew, setStartDateNew] = useState(new Date().toISOString().split('T')[0]);
  const [changeReason, setChangeReason] = useState('نقل إلى مشروع آخر');

  const changeReasonOptions = isAr
    ? [
        { value: 'نقل إلى مشروع آخر', label: 'نقل إلى مشروع آخر' },
        { value: 'ترقية إدارية', label: 'ترقية إدارية' },
        { value: 'انتهاء المرحلة الإنشائية', label: 'انتهاء المرحلة الإنشائية' },
        { value: 'استقالة أو مغادرة', label: 'استقالة أو مغادرة' },
        { value: 'إجازة مؤقتة', label: 'إجازة مؤقتة' }
      ]
    : [
        { value: 'نقل إلى مشروع آخر', label: 'Transfer to another project' },
        { value: 'ترقية إدارية', label: 'Administrative promotion' },
        { value: 'انتهاء المرحلة الإنشائية', label: 'Completion of project phase' },
        { value: 'استقالة أو مغادرة', label: 'Resignation / Departure' },
        { value: 'إجازة مؤقتة', label: 'Temporary leave' }
      ];

  const fetchPMData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // 0. Fetch project record to know authoritative PM assigned on project
      const { data: prjData } = await supabase
        .from('projects')
        .select('project_manager_stakeholder_id, project_manager_name_raw')
        .eq('id', projectId)
        .maybeSingle();

      const effectiveStkId = currentPmStakeholderId || prjData?.project_manager_stakeholder_id || null;
      const effectiveName = (prjData?.project_manager_name_raw || '').trim();

      // 1. Fetch PM history from project_stakeholders
      const { data: psData, error: psError } = await supabase
        .from('project_stakeholders')
        .select(`
          id,
          stakeholder_id,
          project_role,
          start_date,
          end_date,
          is_active,
          termination_reason,
          predecessor_id,
          stakeholder:stakeholders (
            id,
            name_ar,
            name,
            phone,
            job_title
          )
        `)
        .eq('project_id', projectId);

      if (psError) {
        console.error('Error fetching PM history:', psError);
      }

      const records: PMHistoryRecord[] = [];
      if (psData && psData.length > 0) {
        psData.forEach((row: any) => {
          if (isProjectManagerRole(row.project_role)) {
            const stk = row.stakeholder || {};
            records.push({
              id: row.id,
              stakeholder_id: row.stakeholder_id || stk.id || null,
              name: isAr ? (stk.name_ar || stk.name || 'غير معروف') : (stk.name || stk.name_ar || 'Unknown'),
              role: row.project_role || stk.job_title || (isAr ? 'مدير مشروع' : 'Project Manager'),
              phone: stk.phone || undefined,
              start_date: row.start_date,
              end_date: row.end_date,
              is_active: row.is_active ?? true,
              termination_reason: row.termination_reason,
              predecessor_id: row.predecessor_id
            });
          }
        });
      }

      // 2. If no records in project_stakeholders, check pm_project_team
      if (records.length === 0) {
        const { data: ptData } = await supabase
          .from('pm_project_team')
          .select('*')
          .eq('project_id', projectId)
          .ilike('role_title_ar', '%مدير المشروع%');

        if (ptData && ptData.length > 0) {
          ptData.forEach((row: any) => {
            records.push({
              id: row.id,
              stakeholder_id: null,
              name: row.person_name,
              role: row.role_title_ar || (isAr ? 'مدير مشروع' : 'Project Manager'),
              phone: row.phone || undefined,
              start_date: row.start_date,
              end_date: row.end_date,
              is_active: row.is_active ?? true,
              termination_reason: row.termination_reason,
              predecessor_id: row.predecessor_id
            });
          });
        }
      }

      // 3. If records empty, check authoritative project stakeholder or raw name
      if (records.length === 0 && effectiveStkId) {
        const { data: stk } = await supabase
          .from('stakeholders')
          .select('id, name_ar, name, phone, job_title')
          .eq('id', effectiveStkId)
          .maybeSingle();

        if (stk) {
          records.push({
            id: 'direct-pm',
            stakeholder_id: stk.id,
            name: isAr ? (stk.name_ar || stk.name || effectiveName || 'مدير المشروع') : (stk.name || stk.name_ar || effectiveName || 'Project Manager'),
            role: stk.job_title || (isAr ? 'مدير مشروع' : 'Project Manager'),
            phone: stk.phone || undefined,
            start_date: null,
            end_date: null,
            is_active: true
          });
        }
      } else if (records.length === 0 && effectiveName) {
        records.push({
          id: 'direct-pm',
          stakeholder_id: null,
          name: effectiveName,
          role: isAr ? 'مدير المشروع' : 'Project Manager',
          start_date: null,
          end_date: null,
          is_active: true
        });
      }

      // 4. Stable in-memory sorting: Active first, then latest start_date descending (nulls last)
      records.sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        const timeA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const timeB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return timeB - timeA;
      });

      // 5. Determine current active PM strictly matching effective ID or name
      const activeByStk = effectiveStkId
        ? records.find(r => r.is_active && r.stakeholder_id === effectiveStkId)
        : null;
      const activeByName = effectiveName
        ? records.find(r => r.is_active && r.name === effectiveName)
        : null;
      const active = activeByStk || activeByName || records.find(r => r.is_active) || records[0] || null;

      setHistory(records);
      setCurrentPM(active);
    } catch (err) {
      console.error('Failed to load PM data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPmStakeholderId, isAr]);

  useEffect(() => {
    fetchPMData();
  }, [fetchPMData]);

  // Load all available stakeholders for dropdown
  const loadAvailableStakeholders = async () => {
    try {
      const { data } = await supabase
        .from('stakeholders')
        .select('id, name_ar, name, phone, job_title')
        .order('name_ar');
      if (data) {
        setAvailableStakeholders(data.map(s => ({
          id: s.id,
          name: isAr ? (s.name_ar || s.name || '') : (s.name || s.name_ar || ''),
          phone: s.phone || '',
          job_title: s.job_title || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching stakeholders directory:', err);
    }
  };

  const handleConfirmOngoing = async () => {
    if (!currentPM) return;
    try {
      await ProjectService.assignProjectManager(projectId, {
        stakeholderId: currentPM.stakeholder_id || null,
        managerName: currentPM.name,
        phone: currentPM.phone,
        startDate: currentPM.start_date || undefined
      });
      setIsVerified(true);
      toast.success(
        isAr
          ? `تم تأكيد تعيين المهندس ${currentPM.name} مديراً للمشروع بنجاح`
          : `Confirmed engineer ${currentPM.name} as project manager successfully`
      );
      await fetchPMData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error('Failed to confirm PM:', err);
      toast.error(
        err.message ||
          (isAr ? 'حدث خطأ أثناء تأكيد المهندس' : 'Error occurred while confirming project manager')
      );
    }
  };

  const openChangeModal = () => {
    loadAvailableStakeholders();
    setIsModalOpen(true);
  };

  const handleSaveTransfer = async () => {
    if (!selectedNewPmId && !customNewPmName.trim()) {
      toast.error(
        isAr
          ? 'يرجى اختيار أو كتابة اسم مدير المشروع الجديد'
          : 'Please select or enter the new project manager name'
      );
      return;
    }

    setSaving(true);
    try {
      const selectedStk = availableStakeholders.find(s => s.id === selectedNewPmId);
      const targetName = selectedStk?.name || customNewPmName.trim();
      const targetPhone = selectedStk?.phone || customNewPmPhone.trim() || undefined;

      await ProjectService.assignProjectManager(projectId, {
        stakeholderId: selectedNewPmId || null,
        managerName: targetName,
        phone: targetPhone,
        startDate: startDateNew,
        changeReason: changeReason,
        predecessorId: currentPM && currentPM.id !== 'direct-pm' ? currentPM.id : null
      });

      toast.success(
        isAr
          ? 'تم تسجيل تسليم وتعيين مدير المشروع الجديد بنجاح'
          : 'Project manager handover registered successfully'
      );
      setIsModalOpen(false);
      setIsVerified(true);
      await fetchPMData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error('Error during PM transfer:', err);
      toast.error(
        err.message || (isAr ? 'حدث خطأ أثناء نقل المسؤولية' : 'Error occurred during handover')
      );
    } finally {
      setSaving(false);
    }
  };

  const timelineBorderClass = isAr
    ? 'border-r-2 border-emerald-500/40 dark:border-emerald-500/30 pr-4 mr-2'
    : 'border-l-2 border-emerald-500/40 dark:border-emerald-500/30 pl-4 ml-2';

  const timelineBulletClass = isAr ? '-right-[23px]' : '-left-[23px]';

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs hover:shadow-sm space-y-4 transition-all duration-200"
    >
      {/* Top Banner: Verification Prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-normal text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إدارة المهام والتعيين الزمني للمشروع'
                  : 'Project Management & Succession Timeline'}
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/25 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تم التحقق' : 'Verified'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/25 shadow-xs animate-pulse">
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? 'بحاجة لتأكيد' : 'Needs Confirmation'}</span>
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center flex-wrap gap-2">
              <span>{isAr ? 'مدير المشروع الحالي:' : 'Current Project Manager:'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {currentPM?.name || (isAr ? 'لم يتم تعيين مدير مشروع بعد' : 'No project manager assigned yet')}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {isAr ? 'المدير الحالي المعتمد' : 'Current Manager'}
              </span>
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1.5">
              {currentPM?.role && (
                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-[11px]">
                  {currentPM.role}
                </span>
              )}
              {currentPM?.phone && (
                <a 
                  href={`tel:${currentPM.phone}`}
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[11px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                  dir="ltr"
                >
                  <Phone className="w-3 h-3" /> {currentPM.phone}
                </a>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                {currentPM?.start_date
                  ? isAr
                    ? `تاريخ الاستلام: ${currentPM.start_date}`
                    : `Assignment Date: ${currentPM.start_date}`
                  : isAr
                  ? 'تاريخ الاستلام: مسجل كنشط حالياً'
                  : 'Assignment Date: Currently Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Action Buttons */}
        {canEditProject && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-1 sm:mt-0">
            {!isVerified && (
              <button
                type="button"
                onClick={handleConfirmOngoing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد استمرار المهندس' : 'Confirm PM Continuation'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={openChangeModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isAr ? 'تسليم لمدير جديد / تغيير' : 'Transfer / Change PM'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Succession Timeline (تعاقب الإدارة الزمني) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr
                ? 'سجل التعاقب الزمني لإدارة المشروع:'
                : 'Project Management Succession Timeline:'}
            </span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr
              ? `إجمالي التعيينات المسجلة: ${history.length}`
              : `Total records: ${history.length}`}
          </span>
        </div>

        {history.length > 0 ? (
          <div className={`relative ${timelineBorderClass} space-y-3 py-1`}>
            {history.map((record, index) => {
              const isActivePM =
                record.is_active &&
                (record.id === currentPM?.id ||
                  (record.stakeholder_id && record.stakeholder_id === currentPM?.stakeholder_id) ||
                  record.name === currentPM?.name);

              return (
                <div key={record.id || index} className="relative flex items-start justify-between gap-4">
                  {/* Node Bullet */}
                  <div 
                    className={`absolute ${timelineBulletClass} top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      isActivePM
                        ? 'bg-emerald-500 border-white dark:border-slate-900 ring-2 ring-emerald-500/30' 
                        : 'bg-slate-400 dark:bg-slate-500 border-white dark:border-slate-900'
                    }`} 
                  />

                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {record.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {record.role}
                      </span>
                      {isActivePM && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {isAr ? 'المدير الحالي المعتمد' : 'Current Manager'}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-3">
                      <span>
                        {isAr ? 'الفترة:' : 'Period:'}{' '}
                        {record.start_date || (isAr ? 'بداية المشروع' : 'Project Start')} ➔{' '}
                        {record.end_date ||
                          (record.is_active
                            ? isAr
                              ? 'حتى الآن'
                              : 'Present'
                            : isAr
                            ? 'غير محدد'
                            : 'Unspecified')}
                      </span>
                      {record.phone && (
                        <span className="font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                          📱 {record.phone}
                        </span>
                      )}
                    </div>

                    {record.termination_reason && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        {isAr ? 'سبب المغادرة أو التسليم:' : 'Handover Reason:'}{' '}
                        {record.termination_reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
            {isAr
              ? 'لا توجد سجلات تعاقب سابقة مسجلة لهذا المشروع.'
              : 'No previous succession records registered for this project.'}
          </div>
        )}
      </div>

      {/* Change PM Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {isAr
                    ? 'تسليم إدارة المشروع لمهندس جديد'
                    : 'Transfer Project Management to New PM'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Current PM Ending */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  {isAr
                    ? `١. إنهاء فترة المدير الحالي: ${currentPM?.name || 'غير محدد'}`
                    : `1. End tenure of current manager: ${currentPM?.name || 'Unspecified'}`}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                      {isAr ? 'تاريخ انتهاء الإشراف' : 'End Date of Supervision'}
                    </label>
                    <input
                      type="date"
                      value={endDateCurrent}
                      onChange={(e) => setEndDateCurrent(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">
                      {isAr ? 'سبب التغيير أو النقل' : 'Reason for Change'}
                    </label>
                    <select
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors cursor-pointer"
                    >
                      {changeReasonOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* New PM Details */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
                  {isAr
                    ? '٢. اختيار أو تسجيل مدير المشروع الجديد'
                    : '2. Select or register new project manager'}
                </span>

                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                    {isAr
                      ? 'اختيار من الكوادر والمهندسين المسجلين:'
                      : 'Select from registered personnel:'}
                  </label>
                  <select
                    value={selectedNewPmId}
                    onChange={(e) => {
                      setSelectedNewPmId(e.target.value);
                      if (e.target.value) {
                        setCustomNewPmName('');
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {isAr
                        ? '-- اختر من قائمة الكوادر المسجلة --'
                        : '-- Select from registered personnel --'}
                    </option>
                    {availableStakeholders.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {s.name} {s.job_title ? `(${s.job_title})` : ''} {s.phone ? `- ${s.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedNewPmId && (
                  <div className="border-t border-emerald-200/60 dark:border-emerald-800/60 pt-2.5 space-y-2">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
                      {isAr
                        ? 'أو كتابة اسم كادر جديد غير مسجل:'
                        : 'Or enter details of unregistered personnel:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder={isAr ? 'اسم المهندس الجديد' : 'New engineer name'}
                          value={customNewPmName}
                          onChange={(e) => setCustomNewPmName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder={isAr ? 'رقم الهاتف' : 'Phone number'}
                          value={customNewPmPhone}
                          onChange={(e) => setCustomNewPmPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 block mb-1 font-medium">
                    {isAr
                      ? 'تاريخ بداية الاستلام والإشراف:'
                      : 'Start date of handover & supervision:'}
                  </label>
                  <input
                    type="date"
                    value={startDateNew}
                    onChange={(e) => setStartDateNew(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 disabled:opacity-50"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTransfer}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAr ? 'اعتماد التغيير والتسليم' : 'Confirm Handover & Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
