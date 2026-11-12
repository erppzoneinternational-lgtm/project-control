import { useMemo } from 'react';

export type WorkflowTabKey = 'daily_reports' | 'site_tasks' | 'deliverables' | 'inspections';

export interface WorkflowConfig {
  visibleTabs: WorkflowTabKey[];
  defaultTab: WorkflowTabKey;
  defaultFilter: string;
  dataScope: 'my' | 'project' | 'cross_project';
  showKpis: boolean;
  showActionCenter: boolean;
  isCooView: boolean;
}

export const WORKFLOW_TAB_LABELS: Record<WorkflowTabKey, { labelAr: string; labelEn: string }> = {
  daily_reports: { labelAr: 'التقارير اليومية', labelEn: 'Daily Reports' },
  site_tasks: { labelAr: 'مهام الموقع', labelEn: 'Site Tasks' },
  deliverables: { labelAr: 'التسليمات', labelEn: 'Deliverables' },
  inspections: { labelAr: 'طلبات الفحص', labelEn: 'Inspections' },
};

/**
 * Pure configuration hook mapping user roles to workflow dashboard capabilities.
 * Does not execute DB queries.
 */
export function useWorkflowConfig(roles: string[] = [], isAdmin: boolean = false): WorkflowConfig {
  return useMemo(() => {
    // 1. Admin gets all tabs with project scope by default
    if (isAdmin || roles.includes('admin')) {
      return {
        visibleTabs: ['daily_reports', 'site_tasks', 'deliverables', 'inspections'],
        defaultTab: 'daily_reports',
        defaultFilter: 'all',
        dataScope: 'project',
        showKpis: true,
        showActionCenter: true,
        isCooView: false,
      };
    }

    // 2. Executive / COO View
    if (roles.includes('ceo') || roles.includes('coo') || roles.includes('coo_assistant')) {
      return {
        visibleTabs: ['daily_reports', 'site_tasks', 'deliverables', 'inspections'],
        defaultTab: 'daily_reports',
        defaultFilter: 'all',
        dataScope: 'cross_project',
        showKpis: true,
        showActionCenter: false,
        isCooView: true,
      };
    }

    // 3. Project Manager (All tabs, action center enabled)
    if (roles.includes('project_manager')) {
      return {
        visibleTabs: ['daily_reports', 'site_tasks', 'deliverables', 'inspections'],
        defaultTab: 'daily_reports',
        defaultFilter: 'pending_my_decision',
        dataScope: 'project',
        showKpis: true,
        showActionCenter: true,
        isCooView: false,
      };
    }

    // 4. Planning Engineer / Planning Manager
    if (roles.includes('planning_manager') || roles.includes('planning_engineer')) {
      return {
        visibleTabs: ['daily_reports', 'site_tasks'],
        defaultTab: 'daily_reports',
        defaultFilter: 'submitted',
        dataScope: 'project',
        showKpis: true,
        showActionCenter: false,
        isCooView: false,
      };
    }

    // 5. Technical Office Manager
    if (roles.includes('to_manager')) {
      return {
        visibleTabs: ['deliverables', 'inspections'],
        defaultTab: 'deliverables',
        defaultFilter: 'ready_to_return',
        dataScope: 'project',
        showKpis: true,
        showActionCenter: true,
        isCooView: false,
      };
    }

    // 6. Technical Office Engineer
    if (roles.includes('technical_office') || roles.includes('to_engineer')) {
      return {
        visibleTabs: ['deliverables'],
        defaultTab: 'deliverables',
        defaultFilter: 'in_progress',
        dataScope: 'my',
        showKpis: false,
        showActionCenter: false,
        isCooView: false,
      };
    }

    // 7. QC Inspector
    if (roles.includes('qc_inspector') || roles.includes('qc_engineer')) {
      return {
        visibleTabs: ['inspections'],
        defaultTab: 'inspections',
        defaultFilter: 'today',
        dataScope: 'cross_project',
        showKpis: true,
        showActionCenter: false,
        isCooView: false,
      };
    }

    // 8. Site Engineer — site_tasks only; inspections dashboard is QC-only.
    //    Site engineer can *request* inspections from site-workspace, but
    //    the full inspections kanban/management view is restricted to QC roles.
    if (roles.includes('site_engineer')) {
      return {
        visibleTabs: ['site_tasks'],
        defaultTab: 'site_tasks',
        defaultFilter: 'my_tasks',
        dataScope: 'my',
        showKpis: false,
        showActionCenter: false,
        isCooView: false,
      };
    }

    // Fallback: Safe default for unknown roles
    return {
      visibleTabs: ['daily_reports', 'site_tasks'],
      defaultTab: 'daily_reports',
      defaultFilter: 'all',
      dataScope: 'project',
      showKpis: false,
      showActionCenter: false,
      isCooView: false,
    };
  }, [roles, isAdmin]);
}
