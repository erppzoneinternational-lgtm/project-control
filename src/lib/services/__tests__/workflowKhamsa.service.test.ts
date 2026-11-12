import { describe, it, expect } from 'vitest';
import { WorkflowKhamsaService } from '../workflowKhamsa.service';

describe('WorkflowKhamsaService', () => {
  it('returns valid planning insight structure with all 5 Khamsa dimensions', () => {
    const brief = WorkflowKhamsaService.getProjectPlanningBrief('proj-123', 'مشروع الأبراج');
    
    expect(brief).toBeDefined();
    expect(brief.dataDate).toBe('2026-09-20');
    expect(brief.spi).toBe(0.94);
    expect(brief.varianceDays).toBe(-4);
    expect(brief.criticalActivitiesCount).toBeGreaterThan(0);
    expect(brief.longestPathSummary).toBeTruthy();
    expect(brief.keyBottlenecks.length).toBe(5);
    
    // Check 60-second summary structure
    expect(brief.sixSecondsSummary.criticalPathStatus).toContain('المسار الحرج');
    expect(brief.sixSecondsSummary.deliverablesBottleneck).toContain('مخططات');
    expect(brief.sixSecondsSummary.inspectionGates).toContain('WIR');
    expect(brief.sixSecondsSummary.productivityRunRate).toBeTruthy();
    expect(brief.sixSecondsSummary.compressionRecommendation).toContain('توصية');
  });

  it('handles fallback when projectId is all or empty', () => {
    const brief = WorkflowKhamsaService.getProjectPlanningBrief('all');
    expect(brief.baselineCode).toContain('BL-01');
    expect(brief.keyBottlenecks.length).toBe(5);
  });
});
