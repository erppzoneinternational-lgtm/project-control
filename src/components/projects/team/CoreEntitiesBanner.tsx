'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, Client, Stakeholder, StakeholderFull } from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { getOwnerFromProject } from '@/lib/utils/projectOwner';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import {
  deduplicateEntities,
  deduplicatePeople,
  findCanonicalEntity,
} from '@/lib/directory/entityDirectory';
import { toast } from 'sonner';
import { 
  Crown, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Edit3, 
  X, 
  Check, 
  Loader2, 
  ArrowRightLeft, 
  CheckCircle2,
} from 'lucide-react';

interface CoreEntitiesBannerProps {
  project: Project;
  onProjectUpdated?: () => void;
  canEdit?: boolean;
  isAr?: boolean;
}

export const CoreEntitiesBanner: React.FC<CoreEntitiesBannerProps> = ({
  project,
  onProjectUpdated,
  canEdit = true,
  isAr = true,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stakeholdersDirectory, setStakeholdersDirectory] = useState<StakeholderFull[]>([]);

  // Edit Owner Modal State
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [selectedOwnerName, setSelectedOwnerName] = useState<string>('');
  const [savingOwner, setSavingOwner] = useState(false);

  // Edit Client Modal State
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [savingClient, setSavingClient] = useState(false);

  // Edit Consultant Modal State
  const [showEditConsultantModal, setShowEditConsultantModal] = useState(false);
  const [consultantName, setConsultantName] = useState<string>('');
  const [consultantFirm, setConsultantFirm] = useState<string>('');
  const [consultantPhone, setConsultantPhone] = useState<string>('');
  const [consultantClientId, setConsultantClientId] = useState<string>('');
  const [savingConsultant, setSavingConsultant] = useState(false);

  // Change PM Modal State
  const [showChangePmModal, setShowChangePmModal] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<string>('');
  const [customPmName, setCustomPmName] = useState<string>('');
  const [customPmPhone, setCustomPmPhone] = useState<string>('');
  const [pmChangeReason, setPmChangeReason] = useState<string>(isAr ? 'تسليم مرحلي للمشروع' : 'Project phase handover');
  const [pmStartDate, setPmStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savingPm, setSavingPm] = useState(false);

  // Load clients & full stakeholders directory
  const loadDirectories = useCallback(async () => {
    try {
      const [clientsData, peopleData] = await Promise.all([
        ProjectService.getClients(),
        ProjectService.getStakeholdersDirectory({ kind: 'all' }),
      ]);
      setClients(clientsData || []);
      setStakeholdersDirectory(peopleData || []);
    } catch (err) {
      console.error('Failed to load stakeholder directories:', err);
    }
  }, []);

  useEffect(() => {
    loadDirectories();
  }, [loadDirectories]);

  const dedupedEntities = useMemo(() => deduplicateEntities(clients), [clients]);
  const dedupedPeople = useMemo(() => deduplicatePeople(stakeholdersDirectory), [stakeholdersDirectory]);

  const handleEntityCreatedInDirectory = useCallback((created: Client) => {
    setClients((prev) => [created, ...prev]);
  }, []);

  const handlePersonCreatedInDirectory = useCallback((created: Stakeholder) => {
    const fullPerson: StakeholderFull = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      stakeholder_kind: created.stakeholder_kind || 'employee',
      is_active: true,
      assigned_projects_count: 0,
      ...created,
    };
    setStakeholdersDirectory((prev) => [fullPerson, ...prev]);
  }, []);

  // Handlers for Owner
  const handleOpenEditOwner = () => {
    loadDirectories();
    const rawOwnerName = project.metadata?.owner_name || getOwnerFromProject(project);
    const canonical =
      findCanonicalEntity(dedupedEntities, project.metadata?.owner_client_id) ||
      findCanonicalEntity(dedupedEntities, rawOwnerName);
    setSelectedOwnerId(canonical?.id || project.metadata?.owner_client_id || '');
    setSelectedOwnerName(rawOwnerName === 'غير محدد' ? '' : rawOwnerName);
    setShowEditOwnerModal(true);
  };

  const handleSaveOwner = async () => {
    setSavingOwner(true);
    try {
      const canonical =
        findCanonicalEntity(dedupedEntities, selectedOwnerId) ||
        findCanonicalEntity(dedupedEntities, selectedOwnerName);
      const finalOwnerId = canonical?.id || selectedOwnerId || null;
      const finalName = canonical
        ? isAr
          ? canonical.displayNameAr
          : canonical.displayNameEn
        : selectedOwnerName.trim();

      const updatedMetadata = {
        ...(project.metadata || {}),
        owner_name: finalName,
        owner_client_id: finalOwnerId,
      };

      await ProjectService.updateProject(project.id, {
        metadata: updatedMetadata,
      });

      toast.success(isAr ? 'تم تحديث مالك المشروع والمطور العقاري بنجاح' : 'Project Owner & Developer updated successfully');
      setShowEditOwnerModal(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Failed to update owner:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تحديث المالك' : 'Failed to update owner'));
    } finally {
      setSavingOwner(false);
    }
  };

  // Handlers for Client
  const handleOpenEditClient = () => {
    loadDirectories();
    const rawClientName = project.client?.name_ar || project.client_name_raw || '';
    const canonical =
      findCanonicalEntity(dedupedEntities, project.client_id) ||
      findCanonicalEntity(dedupedEntities, rawClientName);
    setSelectedClientId(canonical?.id || project.client_id || '');
    setSelectedClientName(rawClientName);
    setShowEditClientModal(true);
  };

  const handleSaveClient = async () => {
    setSavingClient(true);
    try {
      const canonical =
        findCanonicalEntity(dedupedEntities, selectedClientId) ||
        findCanonicalEntity(dedupedEntities, selectedClientName);
      const finalClientId = canonical?.id || selectedClientId || undefined;
      const clientName = canonical
        ? isAr
          ? canonical.displayNameAr
          : canonical.displayNameEn
        : selectedClientName.trim();

      await ProjectService.updateProject(project.id, {
        client_id: finalClientId,
        client_name_raw: clientName,
      });

      toast.success(isAr ? 'تم تحديث العميل التعاقدي بنجاح' : 'Contractual Client updated successfully');
      setShowEditClientModal(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Failed to update client:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تحديث العميل التعاقدي' : 'Failed to update contractual client'));
    } finally {
      setSavingClient(false);
    }
  };

  // Handlers for Consultant
  const handleOpenEditConsultant = () => {
    loadDirectories();
    const rawFirm = project.metadata?.consultant_firm || '';
    const canonical =
      findCanonicalEntity(dedupedEntities, project.metadata?.consultant_client_id) ||
      findCanonicalEntity(dedupedEntities, rawFirm);
    setConsultantName(project.metadata?.consultant_name || '');
    setConsultantFirm(rawFirm);
    setConsultantPhone(project.metadata?.consultant_phone || '');
    setConsultantClientId(canonical?.id || project.metadata?.consultant_client_id || '');
    setShowEditConsultantModal(true);
  };

  const handleSaveConsultant = async () => {
    setSavingConsultant(true);
    try {
      const canonical =
        findCanonicalEntity(dedupedEntities, consultantClientId) ||
        findCanonicalEntity(dedupedEntities, consultantFirm);
      const finalClientId = canonical?.id || consultantClientId || null;
      const finalFirm = canonical
        ? isAr
          ? canonical.displayNameAr
          : canonical.displayNameEn
        : consultantFirm;

      const updatedMetadata = {
        ...(project.metadata || {}),
        consultant_name: consultantName.trim(),
        consultant_firm: finalFirm.trim(),
        consultant_phone: consultantPhone.trim(),
        consultant_client_id: finalClientId,
      };

      await ProjectService.updateProject(project.id, {
        metadata: updatedMetadata,
      });

      toast.success(isAr ? 'تم تحديث استشاري الإشراف بنجاح' : 'Supervision Consultant updated successfully');
      setShowEditConsultantModal(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Failed to update consultant:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تحديث الاستشاري' : 'Failed to update consultant'));
    } finally {
      setSavingConsultant(false);
    }
  };

  // Handlers for Project Manager Change
  const handleOpenChangePm = () => {
    loadDirectories();
    setSelectedPmId(project.project_manager_stakeholder_id || project.pm_stakeholder_id || '');
    setCustomPmName(project.pm_full_name || project.project_manager_name_raw || project.project_manager || '');
    setCustomPmPhone(project.pm_phone || '');
    setShowChangePmModal(true);
  };

  const handleSavePmTransfer = async () => {
    if (!selectedPmId && !customPmName.trim()) {
      toast.error(isAr ? 'يرجى اختيار مدير المشروع الجديد من الدليل أو إضافته' : 'Please select or add the new Project Manager from the directory');
      return;
    }

    setSavingPm(true);
    try {
      const selected = dedupedPeople.find((s) => s.id === selectedPmId);
      const selectedDisplayName = selected
        ? (isAr ? selected.name_ar : selected.name_en) || selected.name_ar || selected.name_en || ''
        : '';
      const targetName = selectedDisplayName || customPmName.trim();
      const targetPhone = customPmPhone.trim() || selected?.phone || undefined;

      await ProjectService.assignProjectManager(project.id, {
        stakeholderId: selected ? selected.id : selectedPmId || null,
        managerName: targetName,
        phone: targetPhone,
        startDate: pmStartDate,
        changeReason: pmChangeReason,
      });

      toast.success(
        isAr 
          ? `تم تعيين المهندس "${targetName}" مديراً للمشروع بنجاح` 
          : `Engineer "${targetName}" assigned as Project Manager successfully`
      );
      setShowChangePmModal(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Failed to transfer PM:', err);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء تعيين مدير المشروع' : 'Failed to assign Project Manager'));
    } finally {
      setSavingPm(false);
    }
  };

  const currentOwner = getOwnerFromProject(project) || (isAr ? 'غير محدد' : 'Not specified');
  const currentClient = (isAr ? project.client?.name_ar : (project.client?.name_en || project.client?.name_ar)) || project.client_name_raw || (isAr ? 'غير محدد' : 'Not specified');
  const currentPm = project.pm_full_name || project.project_manager_name_raw || project.project_manager || (isAr ? 'غير معين' : 'Unassigned');
  const currentConsultant = project.metadata?.consultant_firm || project.metadata?.consultant_name || (isAr ? 'غير محدد' : 'Not specified');

  return (
    <div className="space-y-4">
      {/* Executive Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-black tracking-normal text-white">
              {isAr ? 'مركز الكيانات التعاقدية وأصحاب المصلحة الرئيسيين' : 'Core Contractual Entities & Key Stakeholders'}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {isAr ? 'ربط مباشر وموثق' : 'Direct & Verified Link'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            {isAr 
              ? 'المالك النهائي، المقاول الرئيسي التعاقدي، مدير مشروع بي زون، واستشاري الإشراف — التحديث ينعكس فورياً في كافة أرجاء النظام'
              : 'Project Owner, Main Contractor, P-Zone Project Manager, and Supervision Consultant — changes update across the system in real time'}
          </p>
        </div>
      </div>

      {/* 4 Core Entity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Project Owner Card */}
        <div className="rounded-2xl p-4.5 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400 dark:border-amber-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300 dark:ring-amber-500/40">
                  <Crown className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="block text-xs font-black text-amber-900 dark:text-amber-300">
                    {isAr ? 'المالك والمطور العقاري' : 'Owner & Developer'}
                  </span>
                  <span className="block text-[10px] font-semibold text-amber-700/80 dark:text-amber-400/80">
                    {isAr ? 'الجهة المالكة والممولة' : 'Financing Entity'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEditOwner}
                  className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
                  title={isAr ? 'تعديل بيانات المالك' : 'Edit Owner Details'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                {currentOwner}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                {isAr ? 'الجهة المالكة والمطورة والممولة للمشروع' : 'Project Owner & Financing Entity'}
              </p>
            </div>

            <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'الحالة:' : 'Status:'}
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {isAr ? 'معتمد للمشروع' : 'Approved for Project'}
              </span>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenEditOwner}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-400/80 dark:border-amber-600/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعديل بيانات المالك' : 'Edit Owner Details'}</span>
            </button>
          )}
        </div>

        {/* 2. Contractual Client / Main Contractor Card */}
        <div className="rounded-2xl p-4.5 bg-gradient-to-br from-cyan-50/70 via-white to-cyan-50/20 dark:from-cyan-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-cyan-400 dark:border-cyan-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-2 ring-cyan-300 dark:ring-cyan-500/40">
                  <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="block text-xs font-black text-cyan-900 dark:text-cyan-300">
                    {isAr ? 'العميل التعاقدي / المقاول الرئيسي' : 'Contractual Client / Contractor'}
                  </span>
                  <span className="block text-[10px] font-semibold text-cyan-700/80 dark:text-cyan-400/80">
                    {isAr ? 'الطرف المتعاقد المباشر' : 'Direct Contract Party'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEditClient}
                  className="p-1.5 rounded-lg text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-300 dark:border-cyan-700 transition-colors cursor-pointer"
                  title={isAr ? 'تعديل بيانات العميل التعاقدي' : 'Edit Contractual Client'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                {currentClient}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                {isAr ? 'الطرف المتعاقد المباشر لتنفيذ المشروع' : 'Direct Contractual Partner for Execution'}
              </p>
            </div>

            <div className="pt-2 border-t border-cyan-200 dark:border-cyan-900/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'كود العميل:' : 'Client Code:'}
              </span>
              <span className="font-mono font-bold text-cyan-800 dark:text-cyan-200 bg-cyan-100/70 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-300 dark:border-cyan-800">
                {project.client?.code || (isAr ? 'معتمد' : 'APPROVED')}
              </span>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenEditClient}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold text-cyan-800 dark:text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border-2 border-cyan-400/80 dark:border-cyan-600/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعديل العميل التعاقدي' : 'Edit Contractual Client'}</span>
            </button>
          )}
        </div>

        {/* 3. Project Manager Card */}
        <div className="rounded-2xl p-4.5 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-400 dark:border-emerald-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 dark:ring-emerald-500/40">
                  <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="block text-xs font-black text-emerald-900 dark:text-emerald-300">
                    {isAr ? 'مدير مشروع بي زون' : 'P-Zone Project Manager'}
                  </span>
                  <span className="block text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">
                    {isAr ? 'المسؤول التنفيذي المعتمد' : 'Accountable Executive'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenChangePm}
                  className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer"
                  title={isAr ? 'تغيير أو نقل مدير المشروع' : 'Change Project Manager'}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                {currentPm}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                {isAr ? 'المسؤول التنفيذي الأول والمعتمد للمشروع' : 'Primary Accountable Executive for Delivery'}
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'الهاتف المباشر:' : 'Direct Phone:'}
              </span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200" dir="ltr">
                {project.pm_phone || (isAr ? 'غير مسجل' : 'Not registered')}
              </span>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenChangePm}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-400/80 dark:border-emerald-600/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isAr ? 'تغيير أو نقل مدير المشروع' : 'Change Project Manager'}</span>
            </button>
          )}
        </div>

        {/* 4. Consultant Card */}
        <div className="rounded-2xl p-4.5 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/20 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-purple-400 dark:border-purple-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300 dark:ring-purple-500/40">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="block text-xs font-black text-purple-900 dark:text-purple-300">
                    {isAr ? 'استشاري الإشراف الهندسي' : 'Supervision Consultant'}
                  </span>
                  <span className="block text-[10px] font-semibold text-purple-700/80 dark:text-purple-400/80">
                    {isAr ? 'مكتب الإشراف والاعتماد' : 'Supervision & Approval'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEditConsultant}
                  className="p-1.5 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-300 dark:border-purple-700 transition-colors cursor-pointer"
                  title={isAr ? 'تعديل بيانات الاستشاري' : 'Edit Consultant Details'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                {currentConsultant}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                {isAr ? 'مكتب الإشراف الهندسي واعتماد الجودة والمستخلصات' : 'Engineering Supervision & Quality Approvals'}
              </p>
            </div>

            <div className="pt-2 border-t border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'مهندس الاستشاري:' : 'Consultant Eng:'}
              </span>
              <span className="font-bold text-purple-800 dark:text-purple-200 truncate max-w-[140px]">
                {project.metadata?.consultant_name || (isAr ? 'استشاري معتمد' : 'Approved Consultant')}
              </span>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenEditConsultant}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold text-purple-800 dark:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border-2 border-purple-400/80 dark:border-purple-600/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تعديل بيانات الاستشاري' : 'Edit Consultant Details'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL 1: Edit Owner Modal ── */}
      {showEditOwnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-amber-300 dark:border-amber-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <Crown className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'تعديل المالك النهائي والمطور العقاري للمشروع' : 'Edit Project Owner & Developer'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'اختر المالك الموحد من الدليل المركزي أو أضف مطوراً جديداً' : 'Select canonical owner from directory or add a new developer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditOwnerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <StakeholderEntitySelect
                id="core-banner-owner-select"
                mode="entity"
                entities={dedupedEntities}
                value={selectedOwnerId}
                legacyDisplayValue={selectedOwnerName}
                preferredCategories={['owner_developer']}
                quickAddType="owner"
                quickAddLabel={isAr ? 'إضافة مالك / مطور جديد' : 'Add New Owner'}
                label={isAr ? 'المالك / المطور العقاري المعتمد:' : 'Approved Owner / Developer:'}
                placeholder={isAr ? 'ابحث واختر المالك أو المطور العقاري...' : 'Search and select owner or developer...'}
                onChange={(val) => {
                  if (!val) {
                    setSelectedOwnerId('');
                    setSelectedOwnerName('');
                    return;
                  }
                  const canonical = findCanonicalEntity(dedupedEntities, val);
                  if (canonical) {
                    setSelectedOwnerId(canonical.id);
                    setSelectedOwnerName(isAr ? canonical.displayNameAr : canonical.displayNameEn);
                  } else {
                    setSelectedOwnerId('');
                    setSelectedOwnerName(val.startsWith('legacy:') ? val.slice(7) : val);
                  }
                }}
                onSelectEntity={(entity) => {
                  setSelectedOwnerId(entity?.id || '');
                  setSelectedOwnerName(entity ? (isAr ? entity.displayNameAr : entity.displayNameEn) : '');
                }}
                onEntityCreated={handleEntityCreatedInDirectory}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditOwnerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveOwner}
                disabled={savingOwner}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
              >
                {savingOwner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isAr ? 'حفظ وتحديث المالك' : 'Save & Update Owner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Edit Client Modal ── */}
      {showEditClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-cyan-300 dark:border-cyan-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-600 text-white shadow-md shadow-cyan-600/30">
                  <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'تعديل العميل التعاقدي / المقاول العام' : 'Edit Contractual Client / Contractor'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'الطرف التعاقدي الرئيسي المرتبط بهذا المشروع من الدليل الموحد' : 'Primary contractual entity associated with this project'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditClientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <StakeholderEntitySelect
                id="core-banner-client-select"
                mode="entity"
                entities={dedupedEntities}
                value={selectedClientId}
                legacyDisplayValue={selectedClientName}
                preferredCategories={['main_contractor', 'owner_developer']}
                quickAddType="client"
                quickAddLabel={isAr ? 'إضافة عميل جديد' : 'Add New Client'}
                label={isAr ? 'العميل التعاقدي / المقاول الرئيسي المعتمد:' : 'Approved Contractual Client:'}
                placeholder={isAr ? 'ابحث واختر العميل التعاقدي...' : 'Search and select contractual client...'}
                onChange={(val) => {
                  if (!val) {
                    setSelectedClientId('');
                    setSelectedClientName('');
                    return;
                  }
                  const canonical = findCanonicalEntity(dedupedEntities, val);
                  if (canonical) {
                    setSelectedClientId(canonical.id);
                    setSelectedClientName(isAr ? canonical.displayNameAr : canonical.displayNameEn);
                  } else {
                    setSelectedClientId('');
                    setSelectedClientName(val.startsWith('legacy:') ? val.slice(7) : val);
                  }
                }}
                onSelectEntity={(entity) => {
                  setSelectedClientId(entity?.id || '');
                  setSelectedClientName(entity ? (isAr ? entity.displayNameAr : entity.displayNameEn) : '');
                }}
                onEntityCreated={handleEntityCreatedInDirectory}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditClientModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                disabled={savingClient}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
              >
                {savingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isAr ? 'حفظ وتحديث العميل' : 'Save & Update Client'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Edit Consultant Modal ── */}
      {showEditConsultantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-300 dark:border-purple-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600 text-white shadow-md shadow-purple-600/30">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'تعديل استشاري الإشراف الهندسي' : 'Edit Engineering Supervision Consultant'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'مكتب الاستشارات الهندسية ومهندس الإشراف المقيم من الدليل المعتمد' : 'Engineering consultancy firm and resident engineer from directory'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditConsultantModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <StakeholderEntitySelect
                id="core-banner-consultant-firm-select"
                mode="entity"
                entities={dedupedEntities}
                value={consultantClientId}
                legacyDisplayValue={consultantFirm}
                preferredCategories={['consultant']}
                quickAddType="consultant"
                quickAddLabel={isAr ? 'إضافة مكتب استشاري جديد' : 'Add New Consultant'}
                label={isAr ? 'مكتب الاستشارات الهندسية:' : 'Consultant Firm:'}
                placeholder={isAr ? 'ابحث واختر مكتب الاستشاري...' : 'Search or select consultant firm...'}
                onChange={(val) => {
                  if (!val) {
                    setConsultantClientId('');
                    setConsultantFirm('');
                    return;
                  }
                  const canonical = findCanonicalEntity(dedupedEntities, val);
                  if (canonical) {
                    setConsultantClientId(canonical.id);
                    setConsultantFirm(isAr ? canonical.displayNameAr : canonical.displayNameEn);
                    if (canonical.contact_person && !consultantName) setConsultantName(canonical.contact_person);
                    if (canonical.phone && !consultantPhone) setConsultantPhone(canonical.phone);
                  } else {
                    setConsultantClientId('');
                    setConsultantFirm(val.startsWith('legacy:') ? val.slice(7) : val);
                  }
                }}
                onSelectEntity={(entity) => {
                  if (!entity) {
                    setConsultantClientId('');
                    setConsultantFirm('');
                    return;
                  }
                  setConsultantClientId(entity.id);
                  setConsultantFirm(isAr ? entity.displayNameAr : entity.displayNameEn);
                  if (entity.contact_person && !consultantName) setConsultantName(entity.contact_person);
                  if (entity.phone && !consultantPhone) setConsultantPhone(entity.phone);
                }}
                onEntityCreated={handleEntityCreatedInDirectory}
              />

              <StakeholderEntitySelect
                id="core-banner-consultant-engineer-select"
                mode="person"
                valueMode="name"
                people={dedupedPeople}
                clients={clients}
                value={consultantName}
                legacyDisplayValue={consultantName}
                preferredKinds={['external_expert']}
                defaultQuickAddKind="external_expert"
                preferredClientId={consultantClientId || undefined}
                preferredOrgName={consultantFirm || undefined}
                quickAddLabel={isAr ? 'إضافة مهندس استشاري جديد' : 'Add Resident Engineer'}
                label={isAr ? 'مهندس الاستشاري المقيم:' : 'Resident Consultant Engineer:'}
                placeholder={isAr ? 'ابحث واختر مهندس الاستشاري المقيم...' : 'Search and select resident consultant engineer...'}
                onChange={(val) => {
                  setConsultantName(val.startsWith('legacy:') ? val.slice(7) : val);
                }}
                onSelectPerson={(person) => {
                  if (!person) {
                    setConsultantName('');
                    return;
                  }
                  setConsultantName((isAr ? person.name_ar : person.name_en) || person.name_ar || person.name_en || '');
                  if (person.phone) {
                    setConsultantPhone(person.phone);
                  }
                }}
                onPersonCreated={handlePersonCreatedInDirectory}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'رقم هاتف الاستشاري:' : 'Consultant Phone Number:'}
                </label>
                <input
                  type="text"
                  value={consultantPhone}
                  onChange={(e) => setConsultantPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditConsultantModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveConsultant}
                disabled={savingConsultant}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {savingConsultant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isAr ? 'حفظ وتحديث الاستشاري' : 'Save & Update Consultant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Change Project Manager Modal ── */}
      {showChangePmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-emerald-300 dark:border-emerald-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <ArrowRightLeft className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'تغيير وتوثيق مدير مشروع بي زون' : 'Change & Document P-Zone Project Manager'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'نقل المسؤولية التنفيذية وتوثيق التعاقب الزمني للمشروع' : 'Transfer executive responsibility and document succession'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <StakeholderEntitySelect
                id="core-banner-pm-select"
                mode="person"
                people={dedupedPeople}
                clients={clients}
                value={selectedPmId}
                legacyDisplayValue={customPmName}
                preferredKinds={['employee']}
                defaultQuickAddKind="employee"
                quickAddLabel={isAr ? 'إضافة مهندس جديد للكادر' : 'Add New Staff Engineer'}
                label={isAr ? 'مدير المشروع من الكوادر الهندسية المعتمدة:' : 'Project Manager from Certified Staff:'}
                placeholder={isAr ? 'ابحث واختر المهندس مدير المشروع...' : 'Search and select Project Manager...'}
                onChange={(val) => {
                  if (!val) {
                    setSelectedPmId('');
                    setCustomPmName('');
                    return;
                  }
                  const matched = dedupedPeople.find((p) => p.id === val);
                  if (matched) {
                    setSelectedPmId(matched.id);
                    setCustomPmName((isAr ? matched.name_ar : matched.name_en) || matched.name_ar || matched.name_en || '');
                    if (matched.phone) setCustomPmPhone(matched.phone);
                  } else {
                    setSelectedPmId('');
                    setCustomPmName(val.startsWith('legacy:') ? val.slice(7) : val);
                  }
                }}
                onSelectPerson={(person) => {
                  if (!person) {
                    setSelectedPmId('');
                    setCustomPmName('');
                    return;
                  }
                  setSelectedPmId(person.id);
                  setCustomPmName((isAr ? person.name_ar : person.name_en) || person.name_ar || person.name_en || '');
                  if (person.phone) {
                    setCustomPmPhone(person.phone);
                  }
                }}
                onPersonCreated={handlePersonCreatedInDirectory}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'رقم الهاتف:' : 'Phone Number:'}
                  </label>
                  <input
                    type="text"
                    value={customPmPhone}
                    onChange={(e) => setCustomPmPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'تاريخ بدء التعيين:' : 'Appointment Start Date:'}
                  </label>
                  <input
                    type="date"
                    value={pmStartDate}
                    onChange={(e) => setPmStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'سبب التغيير أو النقل:' : 'Reason for Transfer / Change:'}
                </label>
                <input
                  type="text"
                  value={pmChangeReason}
                  onChange={(e) => setPmChangeReason(e.target.value)}
                  placeholder={isAr ? 'مثال: تسليم مرحلي للمشروع أو إعادة توزيع الكوادر' : 'e.g. Phase handover or resource reallocation'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowChangePmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePmTransfer}
                disabled={savingPm}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {savingPm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isAr ? 'تأكيد تعيين مدير المشروع' : 'Confirm PM Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoreEntitiesBanner;
