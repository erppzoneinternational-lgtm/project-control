import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Client, Project, ProjectDocument } from '@/types';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { ProjectService } from '@/lib/services/project.service';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import { deduplicateEntities } from '@/lib/directory/entityDirectory';
import { Folder, Plus, Trash2, FileText, Loader2, Calendar, X } from 'lucide-react';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { logger } from '@/lib/logger';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

export interface DocumentsTabProps {
  project: Project;
  isAr?: boolean;
}

type FilterType = 'all' | 'site_possession' | 'toc' | 'contract' | 'other';

export const DocumentsTab: React.FC<DocumentsTabProps> = React.memo(({ project, isAr = true }) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEditProject =
    isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);

  const [items, setItems] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const [docType, setDocType] = useState<'site_possession' | 'toc' | 'contract' | 'other'>('site_possession');
  const [titleAr, setTitleAr] = useState('');
  const [filePath, setFilePath] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedEntityName, setSelectedEntityName] = useState('');

  const dedupedEntities = useMemo(() => deduplicateEntities(clients), [clients]);

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const data = await ProjectTabsService.getDocuments(project.id);
      if (!isCancelled || !isCancelled()) {
        setItems(data);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  }, [project.id]);

  useCleanupEffect(async (isCancelled) => {
    await loadData(isCancelled);
  }, [loadData]);

  useEffect(() => {
    if (!showModal) return;
    let active = true;
    ProjectService.getClients()
      .then((data) => {
        if (active) setClients(data || []);
      })
      .catch((err) => {
        logger.error('Failed to load clients for document modal', { detail: err });
      });
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim()) return;

    const cleanTitle = titleAr.trim();
    const cleanEntity = selectedEntityName.trim();
    const finalTitle =
      cleanEntity && !cleanTitle.includes(cleanEntity)
        ? `${cleanTitle} — ${cleanEntity}`
        : cleanTitle;

    setSaving(true);
    try {
      await ProjectTabsService.addDocument({
        project_id: project.id,
        document_type: docType,
        title_ar: finalTitle,
        file_path: filePath.trim() || undefined,
        issue_date: issueDate || undefined,
      });
      setShowModal(false);
      setTitleAr('');
      setFilePath('');
      setIssueDate('');
      setSelectedEntityId('');
      setSelectedEntityName('');
      await loadData();
    } catch (err) {
      logger.error('Failed to add document', { detail: err });
      alert(isAr ? 'حدث خطأ أثناء حفظ الوثيقة' : 'An error occurred while saving the document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ProjectDocument) => {
    const confirmMessage = isAr
      ? `هل أنت متأكد من حذف الوثيقة "${item.title_ar}" ونقلها للأرشيف؟`
      : `Are you sure you want to delete "${item.title_ar}" and move it to archive?`;

    if (!confirm(confirmMessage)) return;

    try {
      await ProjectTabsService.deleteDocument(item.id, item);
      await loadData();
    } catch (err) {
      logger.error('Failed to delete document', { detail: err });
    }
  };

  const getDocTypeBadge = (type?: string) => {
    switch (type) {
      case 'site_possession':
        return {
          label: isAr ? 'محضر تسليم الموقع' : 'Site Handover',
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'toc':
        return {
          label: isAr ? 'شهادة الاستلام الابتدائي' : 'Taking-Over Certificate',
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'contract':
        return {
          label: isAr ? 'العقد والملحقات' : 'Contract & Addenda',
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      default:
        return {
          label: isAr ? 'وثيقة رسمية' : 'Official Document',
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
    }
  };

  const filterOptions: { id: FilterType; labelAr: string; labelEn: string }[] = [
    { id: 'all', labelAr: 'جميع الوثائق', labelEn: 'All Documents' },
    { id: 'site_possession', labelAr: 'محاضر تسليم الموقع', labelEn: 'Site Handover' },
    { id: 'toc', labelAr: 'شهادات الاستلام الابتدائي', labelEn: 'Taking-Over' },
    { id: 'contract', labelAr: 'العقود والملحقات', labelEn: 'Contracts' },
    { id: 'other', labelAr: 'وثائق أخرى', labelEn: 'Other' },
  ];

  const getCount = (filterId: FilterType) => {
    if (filterId === 'all') return items.length;
    return items.filter(item => item.document_type === filterId).length;
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.document_type === filter);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
        <p className="text-xs font-bold">
          {isAr ? 'جاري تحميل وثائق ومستندات المشروع...' : 'Loading project documents...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-500" />
            <span>{isAr ? 'أرشيف الوثائق والمستندات الرسمية' : 'Official Documents & Archive'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'محاضر تسليم الموقع وشهادات الاستلام الابتدائي والعقود الرسمية'
              : 'Site handover records, taking-over certificates, and official contracts'}
          </p>
        </div>
        {canEditProject && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة وثيقة جديدة' : 'Add New Document'}</span>
          </button>
        )}
      </div>

      {/* Snapshot Document Status from project record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl glass-card border border-blue-500/20 bg-blue-500/5 space-y-1.5">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-normal block">
            {isAr ? 'محضر تسليم الموقع - العقد الأصلي' : 'Site Handover Record - Main Contract'}
          </span>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate dir-ltr text-end">
            {project.site_possession_letter || (isAr ? 'غير متاح' : 'Not available')}
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-blue-500/20 bg-blue-500/5 space-y-1.5">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-normal block">
            {isAr ? 'شهادة الاستلام الابتدائي - العقد الأصلي' : 'Taking-Over Certificate - Main Contract'}
          </span>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate dir-ltr text-end">
            {project.toc_letter || (isAr ? 'غير متاح' : 'Not available')}
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {filterOptions.map(opt => {
          const isActive = filter === opt.id;
          const count = getCount(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`min-h-[36px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <span>{isAr ? opt.labelAr : opt.labelEn}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-800">
          {isAr
            ? 'لا توجد وثائق إضافية مرفقة لهذا المشروع في قاعدة البيانات حالياً.'
            : 'No additional documents attached to this project currently.'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card p-10 text-center text-slate-500 dark:text-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-800">
          {isAr
            ? 'لا توجد وثائق مطابقة للتصنيف المحدد حالياً.'
            : 'No documents match the selected filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const badge = getDocTypeBadge(item.document_type);
            return (
              <div
                key={item.id}
                className="glass-card p-4 rounded-xl flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 hover:border-blue-500/30 hover:shadow-md transition-all group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title_ar}
                    </h4>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {item.issue_date && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.issue_date}</span>
                      </span>
                    )}
                  </div>
                  {item.file_path && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 dir-ltr text-end truncate max-w-xl">
                      {item.file_path}
                    </p>
                  )}
                </div>

                {canEditProject && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all shrink-0"
                    title={isAr ? 'حذف الوثيقة ونقلها للأرشيف' : 'Delete and move to archive'}
                    aria-label={isAr ? 'حذف الوثيقة' : 'Delete document'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-document-modal-title"
            className="w-full max-w-md p-6 space-y-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 id="add-document-modal-title" className="text-sm font-bold">
                {isAr ? 'إضافة وثيقة جديدة للمشروع' : 'Add New Project Document'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-all"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوع الوثيقة' : 'Document Type'}
                </label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="site_possession" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {isAr ? 'محضر تسليم الموقع' : 'Site Handover Record'}
                  </option>
                  <option value="toc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {isAr ? 'شهادة الاستلام الابتدائي' : 'Taking-Over Certificate'}
                  </option>
                  <option value="contract" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {isAr ? 'العقد والملحقات' : 'Contract & Addenda'}
                  </option>
                  <option value="other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {isAr ? 'وثيقة أخرى' : 'Other Document'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'عنوان الوثيقة *' : 'Document Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  placeholder={isAr ? 'مثال: محضر تسليم موقع غرفة المضخات رقم 3' : 'e.g. Pump Room #3 Handover Record'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <StakeholderEntitySelect
                  id="document-issuing-entity-select"
                  mode="entity"
                  entities={dedupedEntities}
                  value={selectedEntityId}
                  quickAddType="client"
                  quickAddLabel={isAr ? 'إضافة جهة جديدة' : 'Add Entity'}
                  label={isAr ? 'الجهة الصادرة / الطرف المعني (اختياري)' : 'Issuing Entity / Concerned Party (Optional)'}
                  placeholder={isAr ? 'اختر الجهة الصادرة أو الطرف المعني من الدليل...' : 'Select issuing entity or concerned party...'}
                  onChange={(val) => {
                    if (!val) {
                      setSelectedEntityId('');
                      setSelectedEntityName('');
                    } else {
                      setSelectedEntityId(val);
                    }
                  }}
                  onSelectEntity={(ent) => {
                    setSelectedEntityId(ent?.id || '');
                    setSelectedEntityName(ent ? (isAr ? ent.displayNameAr : ent.displayNameEn) : '');
                  }}
                  onEntityCreated={(created) => {
                    setClients((prev) => [created, ...prev]);
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  {isAr ? 'مسار الملف أو الرابط' : 'File Path or Link'}
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  placeholder="share\invoices\Ongoing Projects\..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold transition-all"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {saving
                      ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                      : (isAr ? 'حفظ الوثيقة' : 'Save Document')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

DocumentsTab.displayName = 'DocumentsTab';
