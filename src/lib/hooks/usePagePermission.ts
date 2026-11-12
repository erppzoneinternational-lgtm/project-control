'use client';

import { useUserRoles } from './useUserRoles';
import { useModuleAccess } from './useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';

export function usePagePermission(path: string) {
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();

  const isLoading = rolesLoading || accessLoading;

  const canView = isLoading ? false : canAccessPath(path, roles, isAdmin, dbAccessRules);
  const canEdit = isLoading ? false : canEditPath(path, roles, isAdmin, dbAccessRules);

  return { canView, canEdit, isAdmin, isLoading, roles };
}
