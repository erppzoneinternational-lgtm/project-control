import { describe, it, expect } from 'vitest';
import React from 'react';
import { TABS_CONFIG, type ProjectTab } from '@/components/projects/tabs/tabsConfig';
import { WBSTab } from '../WBSTab';
import { BoqTab } from '../BoqTab';
import { MilestonesTab } from '../MilestonesTab';
import { ChangeOrdersTab } from '../ChangeOrdersTab';
import { InvoicesTab } from '../InvoicesTab';
import { DocumentsTab } from '../DocumentsTab';
import { ArchiveTab } from '../ArchiveTab';
import { TeamTab } from '../TeamTab';
import { ContractTab } from '../ContractTab';
import { CostControlTab } from '../CostControlTab';
import { Project } from '@/types';

describe('Project Tabs Unification & Integrity Suite', () => {
  const EXPECTED_TABS: ProjectTab[] = [
    'overview',
    'contracts',
    'wbs',
    'boq',
    'cost_control',
    'milestones',
    'change_orders',
    'invoices',
    'snags',
    'documents',
    'team',
    'org_chart',
    'audit_log',
    'archive',
    'settings',
  ];

  it('exposes all 15 unified tabs in TABS_CONFIG without any hidden/omitted tabs', () => {
    const configIds = TABS_CONFIG.map((t) => t.id);
    expect(configIds).toEqual(EXPECTED_TABS);
    expect(configIds.length).toBe(15);
  });

  it('ensures all tabs have complete localization and styling tokens', () => {
    TABS_CONFIG.forEach((tab) => {
      expect(tab.id).toBeDefined();
      expect(tab.labelAr).toBeTruthy();
      expect(tab.labelEn).toBeTruthy();
      expect(tab.icon).toBeDefined();
      expect(tab.activeColorClass).toBeTruthy();
      expect(tab.iconBgClass).toBeTruthy();
    });
  });

  it('ensures no duplicate tab IDs exist', () => {
    const ids = TABS_CONFIG.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('verifies all tab components instantiate cleanly as valid React elements', () => {
    const dummyProject = { id: 'p-1', name_ar: 'مشروع تجريبي' } as unknown as Project;

    const components = [
      WBSTab,
      BoqTab,
      MilestonesTab,
      ChangeOrdersTab,
      InvoicesTab,
      DocumentsTab,
      ArchiveTab,
      TeamTab,
      ContractTab,
      CostControlTab,
    ];

    components.forEach((Comp) => {
      const el = React.createElement(Comp as React.ComponentType<{ project: Project }>, { project: dummyProject });
      expect(React.isValidElement(el)).toBe(true);
    });
  });
});
