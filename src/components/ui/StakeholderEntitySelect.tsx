'use client';

import React, { useMemo, useState } from 'react';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { QuickAddClientModal, QuickEntityType } from '@/components/ui/QuickAddClientModal';
import { QuickAddStakeholderModal } from '@/components/ui/QuickAddStakeholderModal';
import {
  ENTITY_CATEGORY_META,
  EntityCategory,
  NormalizedEntity,
  doesEntityMatchPartyText,
  findCanonicalEntity,
} from '@/lib/directory/entityDirectory';
import { Client, Stakeholder, StakeholderFull, StakeholderKind } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Filter } from 'lucide-react';

export interface EntitySelectProps {
  mode?: 'entity';
  entities: NormalizedEntity[];
  value?: string;
  legacyDisplayValue?: string;
  valueMode?: 'id' | 'name';
  preferredCategories?: EntityCategory[];
  quickAddType?: QuickEntityType;
  allowQuickAdd?: boolean;
  quickAddLabel?: string;
  label?: string;
  labelBadgeClassName?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  onChange?: (val: string) => void;
  onSelectEntity?: (entity: NormalizedEntity | null) => void;
  onEntityCreated?: (newClient: Client) => void;
}

export interface PersonSelectProps {
  mode: 'person';
  people: StakeholderFull[];
  clients?: Client[];
  value?: string;
  legacyDisplayValue?: string;
  valueMode?: 'id' | 'name';
  preferredKinds?: StakeholderKind[];
  preferredClientId?: string;
  preferredOrgName?: string;
  defaultQuickAddKind?: StakeholderKind;
  allowQuickAdd?: boolean;
  quickAddLabel?: string;
  label?: string;
  labelBadgeClassName?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  onChange?: (val: string) => void;
  onSelectPerson?: (person: StakeholderFull | null) => void;
  onPersonCreated?: (newPerson: Stakeholder) => void;
}

export type StakeholderEntitySelectProps = EntitySelectProps | PersonSelectProps;

export const StakeholderEntitySelect: React.FC<StakeholderEntitySelectProps> = (props) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [isQuickPersonOpen, setIsQuickPersonOpen] = useState(false);

  const isPersonMode = props.mode === 'person';

  // --- ENTITY MODE OPTIONS ---
  const entityComputed = useMemo(() => {
    if (isPersonMode) return { options: [] as SelectOption[], resolvedVal: '', hasFilteredOut: false };
    const {
      entities,
      value = '',
      legacyDisplayValue = '',
      valueMode = 'id',
      preferredCategories,
    } = props;

    const matchedCanonical =
      findCanonicalEntity(entities, value) || findCanonicalEntity(entities, legacyDisplayValue);

    const hasCategoryFilter = Boolean(preferredCategories && preferredCategories.length > 0);
    const filteredList =
      hasCategoryFilter && !showAllCategories
        ? entities.filter(
            (e) =>
              preferredCategories!.includes(e.category) ||
              (matchedCanonical && e.id === matchedCanonical.id)
          )
        : entities;

    // Fallback to full list if preferred categories happen to be empty (e.g. 0 subcontractors registered yet)
    const effectiveList = filteredList.length > 0 ? filteredList : entities;
    const hasFilteredOut = hasCategoryFilter && effectiveList.length < entities.length;

    const options: SelectOption[] = effectiveList.map((entity) => {
      const catMeta = ENTITY_CATEGORY_META[entity.category];
      const primaryLabel = isAr ? entity.displayNameAr : entity.displayNameEn;
      const secondaryParts = [
        isAr ? catMeta.shortAr : catMeta.shortEn,
        entity.canonicalCode || undefined,
      ].filter(Boolean);

      return {
        value: valueMode === 'name' ? primaryLabel : entity.id,
        label: primaryLabel,
        subLabel: secondaryParts.join(' • '),
        searchTerms: entity.searchIndex,
        badge: (
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${catMeta.badgeCls}`}
          >
            {isAr ? catMeta.shortAr : catMeta.shortEn}
          </span>
        ),
      };
    });

    let resolvedVal = '';
    if (matchedCanonical) {
      const primaryLabel = isAr ? matchedCanonical.displayNameAr : matchedCanonical.displayNameEn;
      resolvedVal = valueMode === 'name' ? primaryLabel : matchedCanonical.id;
    } else {
      const fallbackText = (legacyDisplayValue || (valueMode === 'name' ? value : '')).trim();
      if (fallbackText && fallbackText !== 'غير محدد') {
        const legacyOptVal = `legacy:${fallbackText}`;
        options.unshift({
          value: legacyOptVal,
          label: fallbackText,
          subLabel: isAr ? 'قيمة محفوظة بالمشروع' : 'Saved project value',
        });
        resolvedVal = legacyOptVal;
      }
    }

    return { options, resolvedVal, hasFilteredOut };
  }, [isPersonMode, props, showAllCategories, isAr]);

  // --- PERSON MODE OPTIONS ---
  const personComputed = useMemo(() => {
    if (!isPersonMode) return { options: [] as SelectOption[], resolvedVal: '', hasFilteredOut: false };
    const {
      people,
      value = '',
      legacyDisplayValue = '',
      valueMode = 'id',
      preferredKinds,
      preferredClientId,
      preferredOrgName,
    } = props;

    const hasKindFilter = Boolean(preferredKinds && preferredKinds.length > 0);
    const kindFiltered =
      hasKindFilter && !showAllCategories
        ? people.filter(
            (p) =>
              preferredKinds!.includes(p.stakeholder_kind || 'employee') ||
              p.id === value ||
              p.name_ar === value ||
              p.name_ar === legacyDisplayValue
          )
        : people;

    const effectiveList = kindFiltered.length > 0 ? kindFiltered : people;
    const hasFilteredOut = hasKindFilter && effectiveList.length < people.length;

    // Sort people belonging to the selected client/organization to the top
    const sorted = [...effectiveList].sort((a, b) => {
      const aLinked =
        (preferredClientId && a.client_id === preferredClientId) ||
        (preferredOrgName &&
          a.organization_name &&
          a.organization_name.toLowerCase().includes(preferredOrgName.toLowerCase()));
      const bLinked =
        (preferredClientId && b.client_id === preferredClientId) ||
        (preferredOrgName &&
          b.organization_name &&
          b.organization_name.toLowerCase().includes(preferredOrgName.toLowerCase()));
      if (aLinked && !bLinked) return -1;
      if (!aLinked && bLinked) return 1;
      return (a.name_ar || '').localeCompare(b.name_ar || '', 'ar');
    });

    const options: SelectOption[] = sorted.map((person) => {
      const displayName = isAr ? person.name_ar || person.name_en || '' : person.name_en || person.name_ar || '';
      const isLinkedToSelectedOrg = Boolean(
        (preferredClientId && person.client_id === preferredClientId) ||
          (preferredOrgName &&
            person.organization_name &&
            doesEntityMatchPartyText(
              {
                id: preferredClientId || 'temp',
                aliasIds: preferredClientId ? [preferredClientId] : [],
                category: 'main_contractor',
                name_ar: preferredOrgName,
                displayNameAr: preferredOrgName,
                displayNameEn: preferredOrgName,
                canonicalCode: '',
                initials: '',
                searchIndex: '',
              },
              person.organization_name
            ))
      );

      const subParts = [
        isLinkedToSelectedOrg ? (isAr ? '★ تابع للجهة المختارة' : '★ Linked to selected entity') : undefined,
        person.employee_code || undefined,
        person.role || person.job_title || undefined,
        person.organization_name && person.stakeholder_kind !== 'employee'
          ? person.organization_name
          : undefined,
      ].filter(Boolean);

      return {
        value: valueMode === 'name' ? person.name_ar || displayName : person.id,
        label: displayName,
        subLabel: subParts.join(' • '),
        searchTerms: `${person.name_ar || ''} ${person.name_en || ''} ${person.employee_code || ''} ${person.organization_name || ''} ${person.phone || ''}`,
      };
    });

    const matchedPerson = people.find(
      (p) =>
        p.id === value ||
        (value && (p.name_ar === value || p.name_en === value)) ||
        (legacyDisplayValue && (p.name_ar === legacyDisplayValue || p.name_en === legacyDisplayValue))
    );

    let resolvedVal = '';
    if (matchedPerson) {
      resolvedVal =
        valueMode === 'name'
          ? matchedPerson.name_ar || matchedPerson.name_en || ''
          : matchedPerson.id;
    } else {
      const fallbackText = (legacyDisplayValue || (valueMode === 'name' ? value : '')).trim();
      if (fallbackText && fallbackText !== 'غير محدد') {
        const legacyOptVal = `legacy:${fallbackText}`;
        options.unshift({
          value: legacyOptVal,
          label: fallbackText,
          subLabel: isAr ? 'قيمة محفوظة بالمشروع' : 'Saved project value',
        });
        resolvedVal = legacyOptVal;
      }
    }

    return { options, resolvedVal, hasFilteredOut };
  }, [isPersonMode, props, showAllCategories, isAr]);

  const activeComputed = isPersonMode ? personComputed : entityComputed;
  const allowQuickAdd = props.allowQuickAdd !== false && !props.disabled;

  const handleSelectChange = (selectedVal: string) => {
    if (!selectedVal) {
      props.onChange?.('');
      if (isPersonMode) {
        props.onSelectPerson?.(null);
      } else {
        props.onSelectEntity?.(null);
      }
      return;
    }

    if (selectedVal.startsWith('legacy:')) {
      const raw = selectedVal.slice('legacy:'.length);
      props.onChange?.(raw);
      return;
    }

    if (isPersonMode) {
      const valueMode = props.valueMode || 'id';
      const person =
        props.people.find((p) => (valueMode === 'name' ? p.name_ar === selectedVal : p.id === selectedVal)) ||
        props.people.find((p) => p.id === selectedVal || p.name_ar === selectedVal) ||
        null;
      props.onChange?.(selectedVal);
      props.onSelectPerson?.(person);
    } else {
      const valueMode = props.valueMode || 'id';
      const entity =
        props.entities.find((e) =>
          valueMode === 'name'
            ? (isAr ? e.displayNameAr : e.displayNameEn) === selectedVal || e.displayNameAr === selectedVal
            : e.id === selectedVal
        ) ||
        findCanonicalEntity(props.entities, selectedVal) ||
        null;
      props.onChange?.(selectedVal);
      props.onSelectEntity?.(entity);
    }
  };

  const defaultQuickLabel = isPersonMode
    ? isAr
      ? 'إضافة شخص جديد'
      : 'Add Person'
    : isAr
    ? 'إضافة جهة جديدة'
    : 'Add Entity';

  return (
    <div className="space-y-1.5">
      {(props.label || allowQuickAdd || activeComputed.hasFilteredOut || showAllCategories) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {props.label ? (
            <label
              htmlFor={props.id}
              className={
                props.labelBadgeClassName ||
                'block font-bold text-slate-700 dark:text-slate-300 text-xs'
              }
            >
              {props.label}
            </label>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            {(activeComputed.hasFilteredOut || showAllCategories) && (
              <button
                type="button"
                onClick={() => setShowAllCategories((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  showAllCategories
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={
                  isAr
                    ? 'التبديل بين عرض الفئة المخصصة لهذا الحقل أو عرض كامل الدليل'
                    : 'Toggle between recommended category and full directory'
                }
              >
                <Filter className="w-2.5 h-2.5" />
                <span>{showAllCategories ? (isAr ? 'كل الدليل' : 'All Directory') : (isAr ? 'عرض الكل' : 'Show All')}</span>
              </button>
            )}

            {allowQuickAdd && (
              <button
                type="button"
                onClick={() =>
                  isPersonMode ? setIsQuickPersonOpen(true) : setIsQuickClientOpen(true)
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Plus className="w-3 h-3" />
                <span>{props.quickAddLabel || defaultQuickLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <CustomSelect
        id={props.id}
        options={activeComputed.options}
        value={activeComputed.resolvedVal}
        onChange={handleSelectChange}
        placeholder={
          props.placeholder ||
          (isPersonMode
            ? isAr
              ? 'ابحث واختر الاسم من دليل أصحاب المصلحة...'
              : 'Search & select person from directory...'
            : isAr
            ? 'ابحث واختر الجهة من الدليل (إعمار، حسن علام...)'
            : 'Search & select entity from directory...')
        }
        searchPlaceholder={
          props.searchPlaceholder ||
          (isAr ? 'ابحث بالاسم العربي أو الإنجليزي أو الكود...' : 'Search by name or code...')
        }
        clearable={props.clearable ?? true}
        disabled={props.disabled}
        footerAction={
          allowQuickAdd ? (
            <button
              type="button"
              onClick={() =>
                isPersonMode ? setIsQuickPersonOpen(true) : setIsQuickClientOpen(true)
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{props.quickAddLabel || defaultQuickLabel}</span>
            </button>
          ) : undefined
        }
      />

      {!isPersonMode && allowQuickAdd && (
        <QuickAddClientModal
          isOpen={isQuickClientOpen}
          onClose={() => setIsQuickClientOpen(false)}
          entityType={props.quickAddType || 'client'}
          onClientAdded={(created) => {
            props.onEntityCreated?.(created);
            const valueMode = props.valueMode || 'id';
            const nextVal =
              valueMode === 'name'
                ? isAr
                  ? created.name_ar
                  : created.name_en || created.name_ar
                : created.id;
            props.onChange?.(nextVal);
            props.onSelectEntity?.({
              ...created,
              id: created.id,
              aliasIds: [created.id],
              category:
                props.quickAddType === 'owner'
                  ? 'owner_developer'
                  : props.quickAddType === 'consultant'
                  ? 'consultant'
                  : props.quickAddType === 'subcontractor'
                  ? 'subcontractor_vendor'
                  : 'main_contractor',
              displayNameAr: created.name_ar,
              displayNameEn: created.name_en || created.name_ar,
              canonicalCode: created.code || '',
              initials: created.name_ar.slice(0, 2),
              searchIndex: `${created.name_ar} ${created.name_en || ''} ${created.code || ''}`.toLowerCase(),
            });
          }}
        />
      )}

      {isPersonMode && allowQuickAdd && (
        <QuickAddStakeholderModal
          isOpen={isQuickPersonOpen}
          onClose={() => setIsQuickPersonOpen(false)}
          defaultKind={props.defaultQuickAddKind || props.preferredKinds?.[0] || 'employee'}
          defaultClientId={props.preferredClientId}
          defaultOrganization={props.preferredOrgName}
          clients={props.clients}
          onStakeholderAdded={(created) => {
            props.onPersonCreated?.(created);
            const valueMode = props.valueMode || 'id';
            const nextVal =
              valueMode === 'name' ? created.name_ar || created.name_en || '' : created.id;
            const fullPerson: StakeholderFull = {
              organization_id: '00000000-0000-0000-0000-000000000001',
              stakeholder_kind:
                created.stakeholder_kind ||
                props.defaultQuickAddKind ||
                props.preferredKinds?.[0] ||
                'employee',
              is_active: true,
              assigned_projects_count: 0,
              ...created,
            };
            props.onChange?.(nextVal);
            props.onSelectPerson?.(fullPerson);
          }}
        />
      )}
    </div>
  );
};
