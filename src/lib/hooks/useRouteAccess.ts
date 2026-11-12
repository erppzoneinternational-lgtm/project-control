'use client';

import { useUserRoles } from './useUserRoles';
import { useModuleAccess } from './useModuleAccess';
import { canAccessPath } from '@/lib/rbac/access-control';

export function useRouteAccess() {
  const { roles, isAdmin, isLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();

  const canAccess = (path: string): boolean => {
    return canAccessPath(path, roles, isAdmin, dbAccessRules);
  };

  return { canAccess, isLoading: isLoading || accessLoading };
}
