import { describe, it, expect, vi } from 'vitest';
import { useWorkflowConfig, WORKFLOW_TAB_LABELS } from '../useWorkflowConfig';

// Mock React useMemo to execute callback immediately
vi.mock('react', () => ({
  useMemo: (fn: () => any) => fn(),
}));

describe('useWorkflowConfig Hook', () => {
  it('exposes correct Arabic tab labels', () => {
    expect(WORKFLOW_TAB_LABELS.daily_reports.labelAr).toBe('التقارير اليومية');
    expect(WORKFLOW_TAB_LABELS.site_tasks.labelAr).toBe('مهام الموقع');
    expect(WORKFLOW_TAB_LABELS.deliverables.labelAr).toBe('التسليمات');
    expect(WORKFLOW_TAB_LABELS.inspections.labelAr).toBe('طلبات الفحص');
  });

  it('returns all tabs with project scope for admin', () => {
    const config = useWorkflowConfig(['admin'], true);
    expect(config.visibleTabs).toEqual([
      'daily_reports',
      'site_tasks',
      'deliverables',
      'inspections',
    ]);
    expect(config.showKpis).toBe(true);
    expect(config.showActionCenter).toBe(true);
    expect(config.isCooView).toBe(false);
  });

  it('returns cross-project scope and coo view for COO / CEO', () => {
    const config = useWorkflowConfig(['coo'], false);
    expect(config.dataScope).toBe('cross_project');
    expect(config.isCooView).toBe(true);
    expect(config.visibleTabs.length).toBe(4);
  });

  it('configures Project Manager with action center and pending decision default', () => {
    const config = useWorkflowConfig(['project_manager'], false);
    expect(config.visibleTabs.length).toBe(4);
    expect(config.defaultFilter).toBe('pending_my_decision');
    expect(config.showActionCenter).toBe(true);
  });

  it('configures Site Engineer with only site_tasks (inspections restricted to QC)', () => {
    const config = useWorkflowConfig(['site_engineer'], false);
    expect(config.visibleTabs).toEqual(['site_tasks']);
    expect(config.defaultTab).toBe('site_tasks');
    expect(config.dataScope).toBe('my');
  });

  it('configures Technical Office Engineer with single deliverables tab', () => {
    const config = useWorkflowConfig(['technical_office'], false);
    expect(config.visibleTabs).toEqual(['deliverables']);
    expect(config.dataScope).toBe('my');
  });

  it('configures QC Inspector with single inspections tab in cross-project scope', () => {
    const config = useWorkflowConfig(['qc_inspector'], false);
    expect(config.visibleTabs).toEqual(['inspections']);
    expect(config.dataScope).toBe('cross_project');
    expect(config.defaultTab).toBe('inspections');
  });

  it('provides safe fallback for unknown role', () => {
    const config = useWorkflowConfig(['unknown_role'], false);
    expect(config.visibleTabs).toEqual(['daily_reports', 'site_tasks']);
    expect(config.dataScope).toBe('project');
    expect(config.isCooView).toBe(false);
  });
});
