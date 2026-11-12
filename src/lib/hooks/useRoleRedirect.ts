'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { RoleRoutingService, CanonicalRole, ROLE_ROUTE_REGISTRY } from '@/lib/services/roleRouting.service';
import { resolveFocusedHomePath } from '@/lib/config/module-visibility';

export interface UseRoleRedirectOptions {
  autoRedirect?: boolean;
  enabled?: boolean;
  fallbackPath?: string;
  allowedSourcePaths?: string[];
}

export interface UseRoleRedirectResult {
  canonicalRole: CanonicalRole | null;
  homePath: string;
  isLoading: boolean;
  isRedirecting: boolean;
  roles: string[];
  isAdmin: boolean;
  redirectToHome: () => void;
}

/**
 * useRoleRedirect — Hook for automatic detection of canonical role and navigation to role-specific landing hubs.
 */
export function useRoleRedirect(options: UseRoleRedirectOptions = {}): UseRoleRedirectResult {
  const {
    autoRedirect = false,
    enabled = true,
    fallbackPath = '/projects',
    allowedSourcePaths = ['/', '/dashboard'],
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const isLoading = authLoading || (!!user && rolesLoading);

  // Compute canonical primary role & home path
  const { canonicalRole, homePath } = useMemo(() => {
    if (!user) {
      return { canonicalRole: null, homePath: fallbackPath };
    }

    const calculatedHome = RoleRoutingService.getHomePath(roles, isAdmin);

    // Resolve top normalized canonical role
    let topRole: CanonicalRole | null = null;
    if (isAdmin) {
      topRole = 'admin';
    } else {
      const canonicalList = roles
        .map((r) => RoleRoutingService.normalizeRole(r))
        .filter((r): r is CanonicalRole => r !== null);

      if (canonicalList.length > 0) {
        canonicalList.sort((a, b) => {
          const pA = ROLE_ROUTE_REGISTRY[a]?.priority ?? 99;
          const pB = ROLE_ROUTE_REGISTRY[b]?.priority ?? 99;
          return pA - pB;
        });
        topRole = canonicalList[0];
      }
    }

    return {
      canonicalRole: topRole,
      homePath: resolveFocusedHomePath(calculatedHome || fallbackPath),
    };
  }, [user, roles, isAdmin, fallbackPath]);

  const redirectToHome = useCallback(() => {
    if (!homePath) return;
    setIsRedirecting(true);
    router.replace(homePath);
  }, [homePath, router]);

  // Handle client-side automatic redirection
  useEffect(() => {
    if (!enabled || !autoRedirect || isLoading || !user) {
      return;
    }

    // Only redirect if user is currently on an allowed source landing path (e.g. '/' or '/dashboard')
    const shouldRedirect = allowedSourcePaths.some((p) => pathname === p || pathname === `${p}/`);

    if (shouldRedirect && homePath && homePath !== pathname) {
      setIsRedirecting(true);
      router.replace(homePath);
    }
  }, [enabled, autoRedirect, isLoading, user, pathname, homePath, allowedSourcePaths, router]);

  return {
    canonicalRole,
    homePath,
    isLoading,
    isRedirecting,
    roles,
    isAdmin,
    redirectToHome,
  };
}
