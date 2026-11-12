'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'pzone:favorite-projects:';
const FAVORITES_EVENT = 'pzone:favorite-projects-change';

export function getFavoritesStorageKey(userId?: string | null): string {
  return `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
}

export function parseFavoriteIds(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .filter((v): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter(Boolean)
      )
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseFavoriteIds(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export function toggleFavoriteIdInSet(
  current: ReadonlySet<string>,
  projectId: string
): { nextIds: string[]; added: boolean } {
  const trimmed = String(projectId || '').trim();
  if (!trimmed) {
    return { nextIds: Array.from(current), added: false };
  }
  const next = new Set(current);
  let added = false;
  if (next.has(trimmed)) {
    next.delete(trimmed);
    added = false;
  } else {
    next.add(trimmed);
    added = true;
  }
  return { nextIds: Array.from(next), added };
}

interface FavoritesChangeDetail {
  storageKey: string;
  ids: string[];
}

export function useFavoriteProjects(
  userId?: string | null,
  userMetadataFavorites?: unknown
) {
  const storageKey = useMemo(() => getFavoritesStorageKey(userId), [userId]);
  const [favoriteIdList, setFavoriteIdList] = useState<string[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedKeyRef = useRef<string | null>(null);

  // Hydrate from localStorage + Supabase user_metadata on mount / user switch
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let localIds: string[] = [];
    let hasLocalRecord = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        hasLocalRecord = true;
        localIds = parseFavoriteIds(raw);
      } else if (userId) {
        // Carry over guest favorites if user clicked before session finished hydrating
        const guestRaw = localStorage.getItem(getFavoritesStorageKey(null));
        if (guestRaw !== null) {
          localIds = parseFavoriteIds(guestRaw);
        }
      }
    } catch {
      // Ignore storage access errors
    }

    const remoteIds = parseFavoriteIds(userMetadataFavorites);
    const merged = hasLocalRecord
      ? localIds
      : Array.from(new Set([...remoteIds, ...localIds]));

    initializedKeyRef.current = storageKey;
    setFavoriteIdList(merged);

    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {
      // Ignore storage write errors
    }
  }, [storageKey, userId, userMetadataFavorites]);

  // Cross-component & cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<FavoritesChangeDetail>).detail;
      if (detail && detail.storageKey === storageKey) {
        setFavoriteIdList(detail.ids);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setFavoriteIdList(parseFavoriteIds(e.newValue));
      }
    };

    window.addEventListener(FAVORITES_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const favoriteIds = useMemo(() => new Set(favoriteIdList), [favoriteIdList]);

  const isFavorite = useCallback(
    (projectId?: string | null) => {
      if (!projectId) return false;
      return favoriteIds.has(projectId);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (projectId: string, projectLabel?: string, isAr: boolean = true): boolean => {
      if (!projectId) return false;

      const { nextIds, added } = toggleFavoriteIdInSet(favoriteIds, projectId);
      setFavoriteIdList(nextIds);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextIds));
        } catch {
          // Ignore storage errors
        }
        window.dispatchEvent(
          new CustomEvent<FavoritesChangeDetail>(FAVORITES_EVENT, {
            detail: { storageKey, ids: nextIds },
          })
        );
      }

      const cleanLabel = projectLabel?.trim();
      if (added) {
        toast.success(
          isAr ? 'تمت الإضافة إلى المفضلة' : 'Added to Favorites',
          cleanLabel ? { description: cleanLabel } : undefined
        );
      } else {
        toast.info(
          isAr ? 'تمت الإزالة من المفضلة' : 'Removed from Favorites',
          cleanLabel ? { description: cleanLabel } : undefined
        );
      }

      // Persist asynchronously to Supabase Auth user_metadata across devices
      if (userId) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          supabase.auth
            .updateUser({ data: { favorite_project_ids: nextIds } })
            .catch(() => {
              // Non-blocking cloud preference sync; localStorage remains authoritative locally
            });
        }, 350);
      }

      return added;
    },
    [favoriteIds, storageKey, userId]
  );

  return {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    isFavorite,
    toggleFavorite,
  };
}
