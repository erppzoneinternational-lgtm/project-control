'use client';

import { useEffect, useMemo } from 'react';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SUPABASE_SCHEMA } from '@/lib/supabase/config';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

const EMPTY_ROLES: string[] = [];
const E2E_BYPASS_ROLES: string[] = [
  'admin',
  'commercial_manager',
  'coo',
  'project_manager',
  'contract_admin',
];

const fallbackQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      enabled: false,
    },
  },
});

function useSafeQueryClient(): QueryClient {
  try {
    return useQueryClient();
  } catch {
    return fallbackQueryClient;
  }
}

export function profileImpliesCoo(department?: string | null, fullName?: string | null): boolean {
  const d = String(department || '').trim().toUpperCase();
  if (d === 'COO' || d.includes('COO') || d.includes('CHIEF OPERATING')) return true;
  const n = String(fullName || '').toUpperCase();
  return /\(COO\)|\bCOO\b/.test(n);
}

export type UserAccountStatus = 'pending_activation' | 'active' | 'suspended' | 'rejected' | string;

export interface UserRolesAndStatus {
  roles: string[];
  status: UserAccountStatus | null;
  isActive: boolean;
  hasProfile: boolean;
}

export async function fetchUserRolesAndStatus(userId: string): Promise<UserRolesAndStatus> {
  try {
    // Authoritative source: profiles view (computed from Portal Console)
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('roles, is_active, status')
      .eq('id', userId)
      .maybeSingle();

    if (profError) {
      logger.warn('[useUserRoles] Profile query warning:', { detail: profError });
    }

    if (profError || !profile) {
      return { roles: [], status: null, isActive: false, hasProfile: false };
    }

    const roles: string[] = Array.isArray(profile.roles)
      ? profile.roles.map((r: unknown) => String(r))
      : [];
    const status: UserAccountStatus | null = (profile.status as UserAccountStatus | null) ?? null;
    const isActive = profile.status === 'active' && profile.is_active !== false;

    return { roles, status, isActive, hasProfile: true };
  } catch (err) {
    logger.warn('[useUserRoles] Error loading roles and status', { detail: err });
    return { roles: [], status: null, isActive: false, hasProfile: false };
  }
}

export async function fetchUserRoles(userId: string): Promise<string[]> {
  const result = await fetchUserRolesAndStatus(userId);
  return result.roles;
}

// Shared module-level state for real-time profile listeners to prevent duplicate channel creation/subscription
interface ProfileRealtimeState {
  channel: ReturnType<typeof supabase.channel>;
  listeners: Set<() => void>;
}

const activeProfileChannels = new Map<string, ProfileRealtimeState>();

export function subscribeToUserProfileChanges(userId: string, onUpdate: () => void): () => void {
  if (!userId) return () => {};

  const channelName = `user-profile-status-listener-${userId}`;
  let state = activeProfileChannels.get(userId);

  if (!state) {
    // If a stale or left-over channel with this name exists on supabase client, clean it up first
    try {
      if (typeof supabase?.getChannels === 'function') {
        const existing = supabase.getChannels().find(
          (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
        );
        if (existing && typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(existing);
        }
      }
    } catch {
      // ignore cleanup errors
    }

    const listeners = new Set<() => void>();

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: SUPABASE_SCHEMA,
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          listeners.forEach((fn) => {
            try {
              fn();
            } catch (err) {
              logger.warn('[useUserRoles] Realtime callback error', { detail: err });
            }
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          logger.warn('[useUserRoles] Realtime channel subscribe warning', { detail: err });
        }
      });

    state = { channel, listeners };
    activeProfileChannels.set(userId, state);
  }

  state.listeners.add(onUpdate);

  return () => {
    const currentState = activeProfileChannels.get(userId);
    if (!currentState) return;

    currentState.listeners.delete(onUpdate);

    if (currentState.listeners.size === 0) {
      try {
        if (typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(currentState.channel);
        }
      } catch (err) {
        logger.warn('[useUserRoles] Realtime channel removal error', { detail: err });
      }
      activeProfileChannels.delete(userId);
    }
  };
}

export function useUserRoles() {
  const { user } = useAuth();
  const queryClient = useSafeQueryClient();

  const isE2EEnabled =
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_VERCEL_ENV &&
    process.env.NEXT_PUBLIC_PZONE_E2E_ENABLED === 'true';
  const isE2EBypass = isE2EEnabled && typeof document !== 'undefined' && document.cookie.includes('pzone-e2e-bypass=true');

  const { data, isLoading, refetch } = useQuery<UserRolesAndStatus>(
    {
      queryKey: ['user-roles-status', user?.id],
      queryFn: async () => {
        if (!user) return { roles: [], status: null, isActive: false, hasProfile: false };
        return fetchUserRolesAndStatus(user.id);
      },
      enabled: !!user && !isE2EBypass,
    },
    queryClient
  );

  // Real-time listener: ref-counted singleton channel ensures exactly 1 subscription per user
  useEffect(() => {
    if (!user?.id || isE2EBypass) return;

    const unsubscribe = subscribeToUserProfileChanges(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles-status', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    });

    return unsubscribe;
  }, [user?.id, isE2EBypass, queryClient]);

  const roles = useMemo(
    () => (isE2EBypass ? E2E_BYPASS_ROLES : (data?.roles ?? EMPTY_ROLES)),
    [isE2EBypass, data?.roles]
  );
  const status: UserAccountStatus | null = isE2EBypass ? 'active' : (data?.status ?? null);
  const hasProfile = isE2EBypass ? true : (data?.hasProfile ?? false);
  const isActive = isE2EBypass ? true : (data?.isActive ?? false);

  const hasRole = (role: string) => isE2EBypass || roles.includes(role);
  const hasAnyRole = (checkRoles: string[]) => isE2EBypass || checkRoles.some((r) => roles.includes(r));
  const isAdmin = isE2EBypass || roles.includes('admin');
  const isCoo = isE2EBypass || roles.includes('coo');
  const isCooAssistant = isCoo || roles.includes('coo_assistant') || roles.includes('assistant') || roles.includes('coo_sec');

  const isPending = status === 'pending_activation';
  const isSuspended = status === 'suspended' || status === 'rejected';

  return {
    roles,
    status,
    isActive,
    hasProfile,
    isPending,
    isSuspended,
    isLoading: isE2EBypass ? false : isLoading,
    refetch,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCoo,
    isCooAssistant,
    user,
  };
}
