'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';

export interface UseAssignedProjectsOptions {
  /**
   * When true, enforces strict staffing for operational roles (e.g., technical_office, site_engineer)
   * so they only see projects where they are explicitly assigned in project_stakeholders.
   * Default: true.
   */
  strictStaffing?: boolean;
}

export interface UseAssignedProjectsResult {
  projects: Project[];
  allowedProjectIds: string[] | null;
  isLoading: boolean;
  isUnrestricted: boolean;
  hasNoAssignedProjects: boolean;
  refetch: () => Promise<unknown>;
}

/**
 * useAssignedProjects — Central governance hook for project scoping.
 * Enforces row-level visibility: Engineers only see projects they are assigned to.
 * Executive leadership (admin, ceo, coo, chairman, commercial_manager) retains unrestricted oversight.
 */
export function useAssignedProjects(options: UseAssignedProjectsOptions = {}): UseAssignedProjectsResult {
  const { strictStaffing = true } = options;
  const { user, loading: authLoading } = useAuth();
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();

  const userEmail = user?.email;
  const userId = user?.id;

  const query = useQuery<Project[]>({
    queryKey: ['assigned-projects', userEmail, userId, roles, isAdmin, strictStaffing],
    queryFn: async () => {
      // 1. If admin, completely unrestricted
      if (isAdmin) {
        const allProjects = await ProjectService.getProjects();
        return allProjects || [];
      }

      if (!userEmail) return [];

      // 2. Resolve assigned project IDs with strict staffing option
      const allowedIds = await ProjectService.getUserAssignedProjectIds(
        userEmail,
        roles,
        { strictStaffing, userId }
      );

      // null = unrestricted leadership role (e.g. CEO, COO, Chairman)
      if (allowedIds === null) {
        const allProjects = await ProjectService.getProjects();
        return allProjects || [];
      }

      // If allowedIds is empty array, the user has no assigned projects (fail-closed)
      if (allowedIds.length === 0) {
        return [];
      }

      // Fetch only allowed projects
      const scopedProjects = await ProjectService.getProjects({}, allowedIds);
      return scopedProjects || [];
    },
    enabled: !authLoading && !rolesLoading,
    staleTime: 60000,
  });

  const projects = query.data || [];
  const isLoading = authLoading || rolesLoading || query.isLoading;
  const isUnrestricted =
    isAdmin ||
    (!rolesLoading &&
      roles.some((r) =>
        ['admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member', 'viewer', 'commercial_manager'].includes(r)
      ));
  const hasNoAssignedProjects = !isLoading && !isUnrestricted && projects.length === 0;

  return {
    projects,
    allowedProjectIds: isUnrestricted ? null : projects.map((p) => p.id),
    isLoading,
    isUnrestricted,
    hasNoAssignedProjects,
    refetch: query.refetch,
  };
}
