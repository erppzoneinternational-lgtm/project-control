import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '@/lib/services/project.service';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getUserAssignedProjectIds: vi.fn(),
    getProjects: vi.fn(),
  },
}));

describe('useAssignedProjects Governance Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unrestricted leadership roles bypass project filtering', async () => {
    vi.mocked(ProjectService.getUserAssignedProjectIds).mockResolvedValue(null);
    vi.mocked(ProjectService.getProjects).mockResolvedValue([
      { id: 'p1', project_name_ar: 'مشروع 1' } as any,
      { id: 'p2', project_name_ar: 'مشروع 2' } as any,
    ]);

    const allowed = await ProjectService.getUserAssignedProjectIds('admin@pzone.com', ['admin'], { strictStaffing: true });
    expect(allowed).toBeNull();

    const allProjects = await ProjectService.getProjects();
    expect(allProjects).toHaveLength(2);
  });

  it('technical office engineer with assigned projects receives only those projects', async () => {
    vi.mocked(ProjectService.getUserAssignedProjectIds).mockResolvedValue(['p1']);
    vi.mocked(ProjectService.getProjects).mockResolvedValue([
      { id: 'p1', project_name_ar: 'مشروع 1' } as any,
    ]);

    const allowed = await ProjectService.getUserAssignedProjectIds(
      'engineer@pzone.com',
      ['technical_office'],
      { strictStaffing: true }
    );
    expect(allowed).toEqual(['p1']);

    const scopedProjects = await ProjectService.getProjects({}, allowed!);
    expect(scopedProjects).toHaveLength(1);
    expect(scopedProjects[0].id).toBe('p1');
  });

  it('technical office engineer with zero assigned projects receives empty list (fail-closed)', async () => {
    vi.mocked(ProjectService.getUserAssignedProjectIds).mockResolvedValue([]);

    const allowed = await ProjectService.getUserAssignedProjectIds(
      'newbie@pzone.com',
      ['technical_office'],
      { strictStaffing: true }
    );
    expect(allowed).toEqual([]);
  });
});
