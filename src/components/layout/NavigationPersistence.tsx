'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/stores/useAuthStore';

const LEGACY_LAST_PATH_KEY = 'pzone_last_path';

const BLOCKED_EXACT_PATHS = new Set([
  '/',
  '/no-access',
  '/unauthorized',
]);

const BLOCKED_PATH_PREFIXES = ['/no-access/', '/unauthorized/'];

export function getScopedLastPathKey(userId: string): string {
  return `${LEGACY_LAST_PATH_KEY}:${userId}`;
}

export function isPersistablePath(rawPath: string | null | undefined): boolean {
  if (!rawPath || !rawPath.startsWith('/') || rawPath.startsWith('//')) {
    return false;
  }
  const cleanPathname = rawPath.split('?')[0].split('#')[0];
  if (BLOCKED_EXACT_PATHS.has(cleanPathname)) {
    return false;
  }
  return !BLOCKED_PATH_PREFIXES.some((prefix) => cleanPathname.startsWith(prefix));
}

/**
 * Tracks navigation and persists the last visited URL (path + query string)
 * to localStorage scoped strictly by authenticated user ID (`pzone_last_path:${userId}`).
 * Purges any legacy unscoped `pzone_last_path` entry so shared workstations never leak
 * navigation history across user accounts.
 */
export function NavigationPersistence() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const restoredUserRef = useRef<string | null>(null);

  // Purge legacy unscoped key so User B never inherits User A's last visited URL
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_LAST_PATH_KEY);
    } catch {
      // ignore localStorage access errors
    }
  }, [userId]);

  // Redirect to user's last saved path when landing on "/"
  useEffect(() => {
    if (!userId || pathname !== '/') return;
    if (restoredUserRef.current === userId) return;
    restoredUserRef.current = userId;

    const scopedKey = getScopedLastPathKey(userId);
    try {
      const last = localStorage.getItem(scopedKey);
      if (!last) return;
      if (isPersistablePath(last)) {
        router.replace(last);
      } else {
        localStorage.removeItem(scopedKey);
      }
    } catch {
      // ignore localStorage access errors
    }
  }, [pathname, router, userId]);

  // On navigation: save current full path strictly under the active user's key
  useEffect(() => {
    if (!userId || !isPersistablePath(pathname)) return;

    const scopedKey = getScopedLastPathKey(userId);
    try {
      const qs = searchParams?.toString() ?? '';
      const full = qs ? `${pathname}?${qs}` : pathname;
      localStorage.setItem(scopedKey, full);
    } catch {
      // ignore localStorage access errors
    }
  }, [pathname, searchParams, userId]);

  return null;
}
