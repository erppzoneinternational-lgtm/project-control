'use client';

import { useEffect, useMemo } from 'react';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

import { PRIMARY_ADMIN_EMAILS } from '@/lib/services/userService';

export type UserAccountStatus = 'pending_activation' | 'active' | 'suspended' | 'rejected';

export interface UserRolesAndStatus {
  roles: string[];
  status: UserAccountStatus;
}

export async function fetchUserRolesAndStatus(userId: string): Promise<UserRolesAndStatus> {
  try {
    // 1. Fetch roles array and status from profiles (authoritative source)
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('roles, is_active, status, email')
      .eq('id', userId)
      .maybeSingle();

    if (profError) {
      logger.warn('[useUserRoles] Profile query warning:', { detail: profError });
    }

    let roles: string[] = [];
    if (profile && Array.isArray(profile.roles) && profile.roles.length > 0) {
      roles = profile.roles.map((r: any) => String(r));
    } else {
      // 2. Fall back to user_roles view/table only if profile.roles is missing
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (userRoles && userRoles.length > 0) {
        roles = userRoles.map((r: any) => String(r.role));
      }
    }

    const email = profile?.email?.toLowerCase();
    const isPrimaryAdmin = !!email && PRIMARY_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);

    if (isPrimaryAdmin && !roles.includes('admin')) {
      roles.unshift('admin');
    }

    let computedStatus: UserAccountStatus = 'pending_activation';

    if (isPrimaryAdmin) {
      computedStatus = 'active';
    } else if (profile?.status === 'suspended') {
      computedStatus = 'suspended';
    } else if (profile?.status === 'rejected') {
      computedStatus = 'rejected';
    } else if (profile?.status === 'pending_activation') {
      computedStatus = 'pending_activation';
    } else if (profile?.status === 'active') {
      computedStatus = roles.length > 0 ? 'active' : 'pending_activation';
    } else if (profile?.is_active === false) {
      // Legacy fallback when status column is not populated
      computedStatus = 'suspended';
    } else if (profile?.is_active === true && roles.length > 0) {
      computedStatus = 'active';
    } else {
      computedStatus = 'pending_activation';
    }

    return { roles, status: computedStatus };
  } catch (err) {
    logger.warn('[useUserRoles] Error loading roles and status', { detail: err });
    return { roles: [], status: 'pending_activation' };
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
          schema: 'public',
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
        if (!user) return { roles: [], status: 'pending_activation' as UserAccountStatus };
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

  const userEmail = user?.email?.toLowerCase();
  const isPrimaryAdmin = !!userEmail && PRIMARY_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(userEmail);

  const roles = useMemo(() => {
    const baseRoles = isE2EBypass ? E2E_BYPASS_ROLES : (data?.roles ?? EMPTY_ROLES);
    return isPrimaryAdmin && !baseRoles.includes('admin') ? ['admin', ...baseRoles] : baseRoles;
  }, [isE2EBypass, isPrimaryAdmin, data?.roles]);
  const status: UserAccountStatus = (isE2EBypass || isPrimaryAdmin) ? 'active' : (data?.status || 'pending_activation');

  const hasRole = (role: string) => isE2EBypass || isPrimaryAdmin || roles.includes(role);
  const hasAnyRole = (checkRoles: string[]) => isE2EBypass || isPrimaryAdmin || checkRoles.some(r => roles.includes(r));
  const isAdmin = isE2EBypass || isPrimaryAdmin || roles.includes('admin');
  const isCoo = isE2EBypass || roles.includes('coo');
  const isCooAssistant = isCoo || roles.includes('coo_assistant') || roles.includes('assistant') || roles.includes('coo_sec');

  const isActive = status === 'active';
  const isPending = status === 'pending_activation';
  const isSuspended = status === 'suspended' || status === 'rejected';

  return {
    roles,
    status,
    isActive,
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
