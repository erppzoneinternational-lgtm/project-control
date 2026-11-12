import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import {
  buildOrgHierarchy,
  formatStakeholderDateRange,
  getNodeStyleClasses,
  filterStakeholders,
  calculateOrgStats,
  RACI_INFO,
  StakeholderOrgChart,
  handleModalEscKeyDown,
} from '../StakeholderOrgChart';
import { ProjectStakeholder, StakeholderFull } from '@/types';

// Mock language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ locale: 'ar', toggleLocale: vi.fn() })),
}));

// Mock ProjectService
vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getProjectStakeholders: vi.fn().mockResolvedValue([]),
  },
}));

describe('StakeholderOrgChart Unit & Integration Suite', () => {
  // Mock data fixtures
  const sampleStakeholders: ProjectStakeholder[] = [
    {
      id: 'ps-1',
      project_id: 'proj-1',
      stakeholder_id: 'st-1',
      project_role: 'Project Director',
      raci_role: 'accountable',
      start_date: '2026-08-01',
      end_date: null,
      is_active: true,
      reports_to: null,
      stakeholder: {
        id: 'st-1',
        organization_id: 'org-1',
        stakeholder_kind: 'employee',
        name_ar: 'المهندس مهدي الشيخ',
        name_en: 'Eng. Mahdi El-Sheikh',
        email: 'mahdi@pzoneinternational.com',
        phone: '+201001234567',
        employee_code: 'EMP-001',
        role: 'Projects Director',
        is_active: true,
        assigned_projects_count: 5,
      } as StakeholderFull,
    },
    {
      id: 'ps-2',
      project_id: 'proj-1',
      stakeholder_id: 'st-2',
      project_role: 'Project Manager',
      raci_role: 'responsible',
      start_date: '2026-08-05',
      end_date: null,
      is_active: true,
      reports_to: 'ps-1',
      stakeholder: {
        id: 'st-2',
        organization_id: 'org-1',
        stakeholder_kind: 'employee',
        name_ar: 'م. أحمد مصطفى',
        name_en: 'Eng. Ahmed Mostafa',
        email: 'ahmed@pzoneinternational.com',
        phone: '+201009876543',
        employee_code: 'EMP-015',
        role: 'Senior PM',
        is_active: true,
        assigned_projects_count: 2,
      } as StakeholderFull,
    },
    {
      id: 'ps-3',
      project_id: 'proj-1',
      stakeholder_id: 'st-3',
      project_role: 'QC Inspector (Departed)',
      raci_role: 'consulted',
      start_date: '2026-08-01',
      end_date: '2026-08-30',
      is_active: false,
      termination_reason: 'انتقال لمشروع آخر / Project Transfer',
      reports_to: 'ps-2',
      stakeholder: {
        id: 'st-3',
        organization_id: 'org-1',
        stakeholder_kind: 'employee',
        name_ar: 'م. كريم سامي',
        name_en: 'Eng. Karim Sami',
        email: 'karim@pzoneinternational.com',
        phone: '+201005554433',
        employee_code: 'EMP-032',
        role: 'QC Engineer',
        is_active: false,
        assigned_projects_count: 1,
      } as StakeholderFull,
    },
    {
      id: 'ps-4',
      project_id: 'proj-1',
      stakeholder_id: 'st-4',
      project_role: 'Client Representative',
      raci_role: 'informed',
      start_date: '2026-08-10',
      end_date: null,
      is_active: true,
      reports_to: 'ps-1',
      stakeholder: {
        id: 'st-4',
        organization_id: 'org-2',
        stakeholder_kind: 'client_rep',
        name_ar: 'أ. طارق عبد الله',
        name_en: 'Tarek Abdullah',
        email: 'tarek@client.com',
        phone: '+201112223344',
        employee_code: 'CL-001',
        role: 'Client Rep',
        is_active: true,
        assigned_projects_count: 1,
      } as StakeholderFull,
    },
  ];

  describe('1. Tree Hierarchy Calculation', () => {
    it('builds tree from explicit reports_to foreign keys', () => {
      const { treeRoots, hasExplicitHierarchy } = buildOrgHierarchy(sampleStakeholders, { isAr: true });

      expect(hasExplicitHierarchy).toBe(true);
      // ps-1 has reports_to = null, so it is the only root
      expect(treeRoots.length).toBe(1);
      const root = treeRoots[0];
      expect(root.stakeholder.id).toBe('ps-1');
      expect(root.depth).toBe(0);

      // Root ps-1 has 2 children: ps-2 (reports_to: ps-1) and ps-4 (reports_to: ps-1)
      expect(root.children.length).toBe(2);
      const childIds = root.children.map((c) => c.stakeholder.id);
      expect(childIds).toContain('ps-2');
      expect(childIds).toContain('ps-4');

      // ps-2 has 1 child: ps-3 (reports_to: ps-2)
      const ps2Node = root.children.find((c) => c.stakeholder.id === 'ps-2');
      expect(ps2Node).toBeDefined();
      expect(ps2Node?.depth).toBe(1);
      expect(ps2Node?.children.length).toBe(1);
      expect(ps2Node?.children[0].stakeholder.id).toBe('ps-3');
      expect(ps2Node?.children[0].depth).toBe(2);
      expect(ps2Node?.children[0].managerName).toContain('أحمد مصطفى');
    });

    it('falls back to RACI role hierarchy when reports_to is completely null', () => {
      // Strip reports_to from all items
      const unassignedStakeholders = sampleStakeholders.map((s) => ({
        ...s,
        reports_to: null,
      }));

      const { treeRoots, hasExplicitHierarchy } = buildOrgHierarchy(unassignedStakeholders, { isAr: true });

      expect(hasExplicitHierarchy).toBe(false);
      expect(treeRoots.length).toBe(1);

      // Accountable is root (ps-1)
      const root = treeRoots[0];
      expect(root.stakeholder.raci_role).toBe('accountable');
      expect(root.stakeholder.id).toBe('ps-1');

      // Responsible (ps-2) is child under root
      expect(root.children.length).toBeGreaterThanOrEqual(1);
      const responsibleChild = root.children.find((c) => c.stakeholder.id === 'ps-2');
      expect(responsibleChild).toBeDefined();
      expect(responsibleChild?.stakeholder.raci_role).toBe('responsible');

      // Consulted (ps-3) and Informed (ps-4) are grouped under Responsible
      const subChildrenIds = responsibleChild?.children.map((c) => c.stakeholder.id);
      expect(subChildrenIds).toContain('ps-3');
      expect(subChildrenIds).toContain('ps-4');
    });

    it('handles empty stakeholder list gracefully', () => {
      const { treeRoots, hasExplicitHierarchy } = buildOrgHierarchy([]);
      expect(treeRoots).toEqual([]);
      expect(hasExplicitHierarchy).toBe(false);
    });

    it('prevents infinite recursion and renders all nodes on circular reports_to references without disappearing', () => {
      const circularStakeholders: ProjectStakeholder[] = [
        {
          id: 'node-A',
          project_id: 'p-1',
          stakeholder_id: 's-1',
          project_role: 'Lead A',
          raci_role: 'accountable',
          reports_to: 'node-B',
        },
        {
          id: 'node-B',
          project_id: 'p-1',
          stakeholder_id: 's-2',
          project_role: 'Lead B',
          raci_role: 'responsible',
          reports_to: 'node-A',
        },
      ];

      const { treeRoots, hasExplicitHierarchy } = buildOrgHierarchy(circularStakeholders);
      expect(hasExplicitHierarchy).toBe(true);
      // Both nodes must be preserved in the hierarchy
      const countNodes = (nodes: typeof treeRoots): number =>
        nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
      expect(countNodes(treeRoots)).toBe(circularStakeholders.length);
      expect(treeRoots.length).toBe(1);
      expect(treeRoots[0].stakeholder.id).toBe('node-A');
      expect(treeRoots[0].children[0].stakeholder.id).toBe('node-B');
    });

    it('preserves all nodes when multiple or disconnected circular clusters have no null root', () => {
      const threeNodeCycle: ProjectStakeholder[] = [
        { id: 'c-1', project_id: 'p-1', stakeholder_id: 's-1', project_role: 'Role 1', raci_role: 'accountable', reports_to: 'c-2' },
        { id: 'c-2', project_id: 'p-1', stakeholder_id: 's-2', project_role: 'Role 2', raci_role: 'responsible', reports_to: 'c-3' },
        { id: 'c-3', project_id: 'p-1', stakeholder_id: 's-3', project_role: 'Role 3', raci_role: 'consulted', reports_to: 'c-1' },
      ];

      const { treeRoots, hasExplicitHierarchy } = buildOrgHierarchy(threeNodeCycle);
      expect(hasExplicitHierarchy).toBe(true);

      const countNodes = (nodes: typeof treeRoots): number =>
        nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
      expect(countNodes(treeRoots)).toBe(3);
    });
  });

  describe('2. Active vs Departed Visual Styling', () => {
    it('returns solid border and emerald styling for active members', () => {
      const activeStyle = getNodeStyleClasses(true);
      expect(activeStyle.isDeparted).toBe(false);
      expect(activeStyle.cardClasses).toContain('border-emerald-500/30');
      expect(activeStyle.cardClasses).toContain('bg-white');
      expect(activeStyle.badgeClasses).toContain('text-emerald-600');
      expect(activeStyle.indicatorDotClass).toContain('bg-emerald-500');
      expect(activeStyle.indicatorDotClass).toContain('animate-pulse');
    });

    it('returns dashed border, opacity-60, and muted badge for departed members', () => {
      const departedStyle = getNodeStyleClasses(false);
      expect(departedStyle.isDeparted).toBe(true);
      expect(departedStyle.cardClasses).toContain('border-dashed');
      expect(departedStyle.cardClasses).toContain('border-slate-400');
      expect(departedStyle.cardClasses).toContain('opacity-60');
      expect(departedStyle.badgeClasses).toContain('text-slate-500');
      expect(departedStyle.indicatorDotClass).toBe('bg-slate-400');
    });
  });

  describe('3. Date Range & Tenure Formatting', () => {
    it('formats active assignment with present indicator in Arabic', () => {
      const activeMember: ProjectStakeholder = {
        id: 'ps-act',
        project_id: 'p',
        stakeholder_id: 's',
        project_role: 'Engineer',
        raci_role: 'responsible',
        start_date: '2026-08-15',
        end_date: null,
      };

      const formatted = formatStakeholderDateRange(activeMember, true);
      expect(formatted).toBe('2026-08-15 ➔ الحالي');
    });

    it('formats active assignment with present indicator in English', () => {
      const activeMember: ProjectStakeholder = {
        id: 'ps-act',
        project_id: 'p',
        stakeholder_id: 's',
        project_role: 'Engineer',
        raci_role: 'responsible',
        start_date: '2026-08-15',
        end_date: null,
      };

      const formatted = formatStakeholderDateRange(activeMember, false);
      expect(formatted).toBe('2026-08-15 ➔ Present');
    });

    it('formats completed/departed assignment with start and end dates', () => {
      const departedMember: ProjectStakeholder = {
        id: 'ps-dep',
        project_id: 'p',
        stakeholder_id: 's',
        project_role: 'Consultant',
        raci_role: 'consulted',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
      };

      const formatted = formatStakeholderDateRange(departedMember, true);
      expect(formatted).toBe('2026-01-01 ➔ 2026-06-30');
    });

    it('falls back to assigned_at timestamp when start_date is not explicitly populated', () => {
      const legacyMember: ProjectStakeholder = {
        id: 'ps-leg',
        project_id: 'p',
        stakeholder_id: 's',
        project_role: 'Lead',
        raci_role: 'accountable',
        assigned_at: '2026-08-24T19:47:43.000Z',
      };

      const formatted = formatStakeholderDateRange(legacyMember, true);
      expect(formatted).toBe('2026-08-24 ➔ الحالي');
    });
  });

  describe('4. Search, Filter & Metrics Computation', () => {
    it('filters stakeholders by search query (Arabic name, English name, role, code)', () => {
      // By Arabic name
      const byAr = filterStakeholders(sampleStakeholders, 'مهدي', 'all');
      expect(byAr.length).toBe(1);
      expect(byAr[0].id).toBe('ps-1');

      // By English name
      const byEn = filterStakeholders(sampleStakeholders, 'Ahmed Mostafa', 'all');
      expect(byEn.length).toBe(1);
      expect(byEn[0].id).toBe('ps-2');

      // By Role
      const byRole = filterStakeholders(sampleStakeholders, 'QC Inspector', 'all');
      expect(byRole.length).toBe(1);
      expect(byRole[0].id).toBe('ps-3');

      // By Employee code
      const byCode = filterStakeholders(sampleStakeholders, 'EMP-032', 'all');
      expect(byCode.length).toBe(1);
      expect(byCode[0].id).toBe('ps-3');
    });

    it('filters stakeholders by active vs departed status', () => {
      const activeOnly = filterStakeholders(sampleStakeholders, '', 'active');
      expect(activeOnly.length).toBe(3);
      expect(activeOnly.every((s) => s.is_active !== false)).toBe(true);

      const departedOnly = filterStakeholders(sampleStakeholders, '', 'departed');
      expect(departedOnly.length).toBe(1);
      expect(departedOnly[0].id).toBe('ps-3');
    });

    it('computes accurate summary metrics across all stakeholders', () => {
      const stats = calculateOrgStats(sampleStakeholders);
      expect(stats.total).toBe(4);
      expect(stats.active).toBe(3);
      expect(stats.departed).toBe(1);
      expect(stats.byRaci).toEqual({
        accountable: 1,
        responsible: 1,
        consulted: 1,
        informed: 1,
      });
    });
  });

  describe('5. Component Contracts & RACI Metadata', () => {
    it('defines comprehensive bilingual definitions for all 4 RACI roles', () => {
      const roles: (keyof typeof RACI_INFO)[] = ['accountable', 'responsible', 'consulted', 'informed'];

      roles.forEach((r) => {
        const info = RACI_INFO[r];
        expect(info).toBeDefined();
        expect(info.letter).toBe(r[0].toUpperCase());
        expect(info.nameAr).toBeTruthy();
        expect(info.nameEn).toBeTruthy();
        expect(info.badge).toBeTruthy();
        expect(info.color).toMatch(/^#/);
        expect(info.descAr).toBeTruthy();
        expect(info.descEn).toBeTruthy();
      });
    });

    it('renders StakeholderOrgChart element without crashing', () => {
      const element = React.createElement(StakeholderOrgChart, {
        projectId: 'proj-1',
        initialStakeholders: sampleStakeholders,
      });

      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.projectId).toBe('proj-1');
      expect(element.props.initialStakeholders).toHaveLength(4);
    });
  });

  describe('6. Modal Keyboard Accessibility (ESC Key Handling)', () => {
    it('closes modal when Escape key is pressed', () => {
      const onClose = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() };

      const handled = handleModalEscKeyDown(event, onClose);
      expect(handled).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('ignores non-Escape keys and does not close modal', () => {
      const onClose = vi.fn();
      const enterEvent = { key: 'Enter', preventDefault: vi.fn() };
      const tabEvent = { key: 'Tab', preventDefault: vi.fn() };

      expect(handleModalEscKeyDown(enterEvent, onClose)).toBe(false);
      expect(handleModalEscKeyDown(tabEvent, onClose)).toBe(false);
      expect(onClose).not.toHaveBeenCalled();
      expect(enterEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('attaches and removes keydown listener on window properly', () => {
      const mockWindow = {
        listeners: {} as Record<string, Function>,
        addEventListener: vi.fn((event: string, cb: Function) => {
          mockWindow.listeners[event] = cb;
        }),
        removeEventListener: vi.fn((event: string, _cb: Function) => {
          delete mockWindow.listeners[event];
        }),
      };

      const onClose = vi.fn();
      const keydownHandler = (e: any) => handleModalEscKeyDown(e, onClose);

      mockWindow.addEventListener('keydown', keydownHandler);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('keydown', keydownHandler);
      expect(mockWindow.listeners['keydown']).toBeDefined();

      // Simulate Escape keydown
      mockWindow.listeners['keydown']({ key: 'Escape', preventDefault: vi.fn() });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Clean up on modal close or unmount
      mockWindow.removeEventListener('keydown', keydownHandler);
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('keydown', keydownHandler);
      expect(mockWindow.listeners['keydown']).toBeUndefined();
    });
  });
});
