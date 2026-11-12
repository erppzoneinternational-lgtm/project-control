'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ProjectService } from '@/lib/services/project.service';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { InlineWaveLoader } from '@/components/ui/InlineWaveLoader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Client, Stakeholder, StakeholderKind } from '@/types';
import { deduplicateEntities } from '@/lib/directory/entityDirectory';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateArabicField } from '@/lib/utils/language-validator';
import { X, Plus, UserCheck, AlertCircle, ChevronDown, Building2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface QuickAddStakeholderModalProps {
  isOpen: boolean;
  initialName?: string;
  defaultKind?: StakeholderKind;
  defaultClientId?: string;
  defaultOrganization?: string;
  clients?: Client[];
  onClose: () => void;
  onStakeholderAdded: (newStakeholder: Stakeholder) => void;
}

export const QuickAddStakeholderModal: React.FC<QuickAddStakeholderModalProps> = ({
  isOpen,
  initialName = '',
  defaultKind = 'employee',
  defaultClientId = '',
  defaultOrganization = '',
  clients: propClients,
  onClose,
  onStakeholderAdded,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeKind, setActiveKind] = useState<StakeholderKind>(defaultKind);

  const [nameAr, setNameAr] = useState(initialName);
  const [nameEn, setNameEn] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const [organizationName, setOrganizationName] = useState(defaultOrganization);
  const [loadedClients, setLoadedClients] = useState<Client[]>([]);

  const defaultRoleForKind = (kind: StakeholderKind): string => {
    if (kind === 'client_rep') return isAr ? 'ممثل العميل / المالك' : 'Client / Owner Representative';
    if (kind === 'external_expert') return isAr ? 'مهندس الاستشاري المقيم' : 'Resident Consultant Engineer';
    if (kind === 'vendor_rep') return isAr ? 'مدير مشروع مقاول الباطن' : 'Subcontractor Project Manager';
    return isAr ? 'مدير مشروع' : 'Project Manager';
  };

  const [role, setRole] = useState(() => defaultRoleForKind(defaultKind));
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [phone, setPhone] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState(
    defaultKind === 'employee' ? 'pzoneinternational.com' : 'gmail.com'
  );
  const [customDomain, setCustomDomain] = useState('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveKind(defaultKind);
    setSelectedClientId(defaultClientId);
    setOrganizationName(defaultOrganization);
    setErrorMsg('');
    setIsCustomRole(false);
    setRole(defaultRoleForKind(defaultKind));
    setEmailDomain(defaultKind === 'employee' ? 'pzoneinternational.com' : 'gmail.com');
    if (initialName) setNameAr(initialName);

    if (!propClients || propClients.length === 0) {
      ProjectService.getClients()
        .then((list) => setLoadedClients(list || []))
        .catch(() => {});
    }
  }, [isOpen, defaultKind, defaultClientId, defaultOrganization, initialName, propClients, isAr]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        if (document.body.querySelector(':scope > [role="listbox"]')) return;
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, saving, onClose]);

  const entityOptions = useMemo(() => {
    const normalized = deduplicateEntities(propClients && propClients.length > 0 ? propClients : loadedClients);
    return normalized.map((e) => ({
      value: e.id,
      label: isAr ? e.displayNameAr : e.displayNameEn,
      subLabel: e.canonicalCode || undefined,
    }));
  }, [propClients, loadedClients, isAr]);

  const roleOptions = useMemo(() => {
    if (activeKind === 'client_rep') {
      return [
        { value: isAr ? 'ممثل العميل / المالك' : 'Client / Owner Representative', label: isAr ? 'ممثل العميل / المالك' : 'Client / Owner Representative' },
        { value: isAr ? 'مدير مشروع العميل' : 'Client Project Manager', label: isAr ? 'مدير مشروع العميل' : 'Client Project Manager' },
        { value: isAr ? 'مدير التنفيذ (ممثل المالك)' : 'Construction Manager (Owner Rep)', label: isAr ? 'مدير التنفيذ (ممثل المالك)' : 'Construction Manager (Owner Rep)' },
        { value: isAr ? 'مدير العقود والمشتريات' : 'Contracts Manager', label: isAr ? 'مدير العقود والمشتريات' : 'Contracts Manager' },
        { value: 'custom', label: isAr ? 'مسمى مخصص...' : 'Custom Role...' },
      ];
    }
    if (activeKind === 'external_expert') {
      return [
        { value: isAr ? 'مهندس الاستشاري المقيم' : 'Resident Consultant Engineer', label: isAr ? 'مهندس الاستشاري المقيم' : 'Resident Consultant Engineer' },
        { value: isAr ? 'مدير الإشراف الهندسي' : 'Supervision Director', label: isAr ? 'مدير الإشراف الهندسي' : 'Supervision Director' },
        { value: isAr ? 'استشاري إلكتروميكانيك (MEP)' : 'MEP Consultant', label: isAr ? 'استشاري إلكتروميكانيك (MEP)' : 'MEP Consultant' },
        { value: 'custom', label: isAr ? 'مسمى مخصص...' : 'Custom Role...' },
      ];
    }
    if (activeKind === 'vendor_rep') {
      return [
        { value: isAr ? 'مدير مشروع مقاول الباطن' : 'Subcontractor Project Manager', label: isAr ? 'مدير مشروع مقاول الباطن' : 'Subcontractor Project Manager' },
        { value: isAr ? 'مهندس موقع مقاول الباطن' : 'Subcontractor Site Engineer', label: isAr ? 'مهندس موقع مقاول الباطن' : 'Subcontractor Site Engineer' },
        { value: isAr ? 'مسؤول التوريدات' : 'Supply Representative', label: isAr ? 'مسؤول التوريدات' : 'Supply Representative' },
        { value: 'custom', label: isAr ? 'مسمى مخصص...' : 'Custom Role...' },
      ];
    }
    return [
      { value: isAr ? 'مدير مشروع' : 'Project Manager', label: isAr ? 'مدير مشروع' : 'Project Manager' },
      { value: isAr ? 'مدير مشاريع أول' : 'Senior Project Manager', label: isAr ? 'مدير مشاريع أول' : 'Senior Project Manager' },
      { value: isAr ? 'مدير المكتب الفني' : 'Technical Office Manager', label: isAr ? 'مدير المكتب الفني' : 'Technical Office Manager' },
      { value: isAr ? 'مهندس موقع' : 'Site Engineer', label: isAr ? 'مهندس موقع' : 'Site Engineer' },
      { value: isAr ? 'منسق مشروع' : 'Project Coordinator', label: isAr ? 'منسق مشروع' : 'Project Coordinator' },
      { value: 'custom', label: isAr ? 'مسمى مخصص...' : 'Custom Role...' },
    ];
  }, [activeKind, isAr]);

  const personLabel = useMemo(() => {
    if (activeKind === 'client_rep') return isAr ? 'ممثل العميل / المالك' : 'Client / Owner Rep';
    if (activeKind === 'external_expert') return isAr ? 'مهندس الاستشاري' : 'Consultant Engineer';
    if (activeKind === 'vendor_rep') return isAr ? 'مسؤول مقاول الباطن' : 'Subcontractor Rep';
    return isAr ? 'مدير المشروع / العضو' : 'Project Manager';
  }, [activeKind, isAr]);

  const nameArError = validateArabicField(
    nameAr,
    isAr ? `اسم ${personLabel} بالعربية` : `${personLabel} Name in Arabic`
  );

  const generatePrefix = (englishName: string, arabicName: string): string => {
    let text = englishName.trim();
    if (!text && arabicName) {
      text = arabicName
        .replace(/م\./g, '')
        .replace(/د\./g, '')
        .replace(/أحمد/g, 'ahmed')
        .replace(/محمد/g, 'mohamed')
        .replace(/مصطفى|مصطفي/g, 'mostafa')
        .replace(/عمر/g, 'omar')
        .replace(/كمال/g, 'kamal')
        .replace(/نهلة|نهله/g, 'nahla')
        .replace(/سامي|سامى/g, 'sami')
        .replace(/عامر/g, 'amer')
        .replace(/شريف/g, 'sherif')
        .replace(/فهمي|فهمى/g, 'fahmy')
        .replace(/كريم/g, 'karim')
        .replace(/محمود/g, 'mahmoud')
        .replace(/حسن/g, 'hassan')
        .replace(/طارق/g, 'tarek')
        .replace(/حازم/g, 'hazem')
        .replace(/هلال/g, 'helal');
    }

    const clean = text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);

    if (parts.length >= 3) {
      const middle = parts[1];
      const lastInitial = parts[2][0] || parts[0][0] || '';
      return `${middle}${lastInitial}`;
    } else if (parts.length === 2) {
      const middle = parts[0];
      const initial = parts[1][0] || '';
      return `${middle}${initial}`;
    } else if (parts.length === 1) {
      return parts[0];
    }
    return '';
  };

  useEffect(() => {
    if (!isEmailTouched && activeKind === 'employee') {
      const autoPrefix = generatePrefix(nameEn, nameAr);
      setEmailPrefix(autoPrefix);
    }
  }, [nameEn, nameAr, isEmailTouched, activeKind]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setErrorMsg(
        isAr ? `اسم ${personLabel} باللغة العربية حقل إجباري` : `${personLabel} name in Arabic is required`
      );
      return;
    }

    if (nameArError) {
      setErrorMsg(nameArError);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const domainToUse = emailDomain === 'custom' ? customDomain.trim() : emailDomain;
    const fullEmail = emailPrefix.trim() ? `${emailPrefix.trim()}@${domainToUse}` : undefined;

    const allClients = propClients && propClients.length > 0 ? propClients : loadedClients;
    const matchedClient = selectedClientId
      ? allClients.find((c) => c.id === selectedClientId)
      : undefined;
    const resolvedOrgName =
      activeKind === 'employee'
        ? 'Pzoneinternational'
        : matchedClient?.name_ar || organizationName.trim() || 'جهة خارجية';

    try {
      const created = await ProjectService.createStakeholder({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || undefined,
        employee_code: activeKind === 'employee' ? employeeCode.trim() || undefined : undefined,
        role: role.trim() || defaultRoleForKind(activeKind),
        phone: phone.trim() || undefined,
        email: fullEmail,
        stakeholder_kind: activeKind,
        organization_name: resolvedOrgName,
        client_id: activeKind !== 'employee' && selectedClientId ? selectedClientId : undefined,
      });

      onStakeholderAdded(created);
      onClose();
      setNameAr('');
      setNameEn('');
      setEmployeeCode('');
      setPhone('');
      setEmailPrefix('');
      setIsEmailTouched(false);
      setIsCustomRole(false);
    } catch (err: unknown) {
      logger.error('Failed to add stakeholder', { detail: err });
      setErrorMsg(
        (err as { message?: string } | null)?.message ||
          (isAr
            ? 'حدث خطأ أثناء حفظ الشخص في دليل أصحاب المصلحة'
            : 'An error occurred while adding the stakeholder to the directory')
      );
    } finally {
      setSaving(false);
    }
  };

  const modalNode = (
    <div
      id="add-manager-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-manager-title"
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg p-6 bg-white/95 dark:bg-slate-900/95 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="quick-add-manager-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? `إضافة ${personLabel} إلى الدليل الموحد` : `Add ${personLabel} to Directory`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'يُسجل في دليل أصحاب المصلحة ويُربط تلقائياً بالجهة والمشروع'
                  : 'Registered in central stakeholders directory and linked automatically'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stakeholder Kind Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          {(
            [
              { id: 'employee', labelAr: 'كادر P.Zone', labelEn: 'P.Zone Staff' },
              { id: 'client_rep', labelAr: 'ممثل عميل/مالك', labelEn: 'Client Rep' },
              { id: 'external_expert', labelAr: 'استشاري', labelEn: 'Consultant' },
              { id: 'vendor_rep', labelAr: 'مقاول باطن', labelEn: 'Subcontractor' },
            ] as const
          ).map((item) => {
            const selected = activeKind === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveKind(item.id);
                  setIsCustomRole(false);
                  setRole(defaultRoleForKind(item.id));
                  setEmailDomain(item.id === 'employee' ? 'pzoneinternational.com' : 'gmail.com');
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selected
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? item.labelAr : item.labelEn}
              </button>
            );
          })}
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <FloatingLabelInput
                label={isAr ? `اسم ${personLabel} بالعربية *` : `${personLabel} Name in Arabic *`}
                dir="rtl"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={isAr ? 'مثال: م. مصطفى عمر كمال' : 'e.g. Eng. Mostafa Omar Kamal'}
                error={nameArError || undefined}
                fullWidth
                badgeBgLight="#ffffff"
                badgeBgDark="#0f172a"
                required
                autoFocus
              />
            </div>

            {activeKind !== 'employee' ? (
              <div className="sm:col-span-2 space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'الشركة / الجهة التابع لها (من الدليل)' : 'Organization / Entity'}</span>
                </label>
                <CustomSelect
                  options={entityOptions}
                  value={selectedClientId}
                  onChange={(val) => {
                    setSelectedClientId(val);
                    const opt = entityOptions.find((o) => o.value === val);
                    if (opt) setOrganizationName(opt.label);
                  }}
                  placeholder={
                    organizationName ||
                    (isAr ? 'اختر الشركة من الدليل (حسن علام، إعمار...)' : 'Select company from directory...')
                  }
                  clearable={true}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الرقم الوظيفي' : 'Employee Code'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="EMP-101"
                  className="glass-input w-full text-start font-mono text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all shadow-sm"
                />
              </div>
            )}

            <div className={activeKind !== 'employee' ? 'sm:col-span-2' : ''}>
              <FloatingLabelInput
                label={isAr ? 'الاسم بالإنجليزية' : 'Name in English'}
                dir="ltr"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Mostafa Omar Kamal"
                fullWidth
                badgeBgLight="#ffffff"
                badgeBgDark="#0f172a"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المسمى الوظيفي / الدور' : 'Role / Position'}
              </label>
              <div className="relative">
                <select
                  value={isCustomRole ? 'custom' : role}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomRole(true);
                      setRole('');
                    } else {
                      setIsCustomRole(false);
                      setRole(e.target.value);
                    }
                  }}
                  className="glass-input w-full cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none appearance-none pr-8 rtl:pr-3 rtl:pl-8 py-2.5 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all shadow-sm"
                >
                  {roleOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {isCustomRole && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={isAr ? 'أدخل المسمى الوظيفي المخصص...' : 'Enter custom role title...'}
                    className="glass-input w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all shadow-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
                className="glass-input w-full text-start font-mono text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all shadow-sm"
              />
            </div>

            {/* Email Builder */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>

              <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all overflow-hidden w-full shadow-sm">
                <input
                  type="text"
                  dir="ltr"
                  value={emailPrefix}
                  onChange={(e) => {
                    setEmailPrefix(e.target.value);
                    setIsEmailTouched(true);
                  }}
                  placeholder="name"
                  className="flex-1 bg-transparent py-2.5 px-3 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none text-start min-w-0"
                />

                <span className="text-slate-400 font-bold text-xs select-none px-1">@</span>

                <select
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-mono font-bold py-2.5 px-2 text-emerald-700 dark:text-emerald-400 cursor-pointer outline-none border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-700 transition-colors shrink-0 max-w-[170px] truncate"
                >
                  <option value="pzoneinternational.com">pzoneinternational.com</option>
                  <option value="gmail.com">gmail.com</option>
                  <option value="outlook.com">outlook.com</option>
                  <option value="hotmail.com">hotmail.com</option>
                  <option value="custom">{isAr ? 'نطاق مخصص...' : 'Custom Domain...'}</option>
                </select>
              </div>

              {emailDomain === 'custom' && (
                <div className="mt-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    dir="ltr"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="company.com"
                    className="glass-input w-full font-mono text-xs py-2 px-3 text-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all min-h-[44px]"
            >
              {saving ? (
                <InlineWaveLoader text={isAr ? 'جاري الحفظ...' : 'Saving...'} size="sm" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? `حفظ وتحديد ${personLabel}` : `Save & Select ${personLabel}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalNode, document.body) : modalNode;
};
