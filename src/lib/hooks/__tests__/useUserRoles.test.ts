import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserRoles, fetchUserRolesAndStatus, profileImpliesCoo, subscribeToUserProfileChanges } from '../useUserRoles';

// Mock supabase
const mockFrom = vi.fn();
const mockChannelObj = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};
const mockChannel = vi.fn((_name?: string) => mockChannelObj);
const mockRemoveChannel = vi.fn((_ch?: any) => Promise.resolve('ok'));
const mockGetChannels = vi.fn(() => [] as any[]);

const mockProfileQuery = (data: any) => ({
  select: () => ({
    eq: () => ({
      maybeSingle: async () => ({ data, error: null }),
    }),
    or: () => ({
      maybeSingle: async () => ({ data, error: null }),
    }),
  }),
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    channel: (name: string) => mockChannel(name),
    removeChannel: (ch: any) => mockRemoveChannel(ch),
    getChannels: () => mockGetChannels(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn() },
}));

describe('useUserRoles — DB-only role derivation (V11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns roles from profiles table only (authoritative source)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: ['site_engineer'], status: 'active' });
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const roles = await fetchUserRoles('user-1');
    expect(roles).toEqual(['site_engineer']);
  });

  it('fetchUserRolesAndStatus returns both roles and explicit status', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: ['project_manager'], status: 'active' });
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const result = await fetchUserRolesAndStatus('pm-user');
    expect(result).toEqual({ roles: ['project_manager'], status: 'active' });
  });

  it('fetchUserRolesAndStatus identifies pending_activation users', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: [], status: 'pending_activation' });
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const result = await fetchUserRolesAndStatus('pending-user');
    expect(result).toEqual({ roles: [], status: 'pending_activation' });
  });

  it('fetchUserRolesAndStatus defaults to pending_activation if no roles and no explicit status', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: null, status: null });
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const result = await fetchUserRolesAndStatus('new-user');
    expect(result).toEqual({ roles: [], status: 'pending_activation' });
  });

  it('fetchUserRolesAndStatus handles suspended and rejected accounts', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: ['site_engineer'], status: 'suspended' });
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const result = await fetchUserRolesAndStatus('suspended-user');
    expect(result).toEqual({ roles: ['site_engineer'], status: 'suspended' });
  });

  it('falls back to user_roles table when profile roles array is empty', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery({ roles: [], status: 'active' });
      }
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ role: 'planning_engineer' }],
              error: null,
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
    });

    const roles = await fetchUserRoles('user-2');
    expect(roles).toEqual(['planning_engineer']);
  });

  it('returns empty array when neither profile nor user_roles has data', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockProfileQuery(null);
      }
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    });

    const roles = await fetchUserRoles('user-3');
    expect(roles).toEqual([]);
  });

  it('handles database errors gracefully and returns empty array', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const roles = await fetchUserRoles('user-4');
    expect(roles).toEqual([]);
  });

  it('correctly detects COO from department or name in profileImpliesCoo', () => {
    expect(profileImpliesCoo('COO Office', 'Ahmed Ali')).toBe(true);
    expect(profileImpliesCoo('Chief Operating Officer', 'Hassan')).toBe(true);
    expect(profileImpliesCoo('Engineering', 'Mohamed (COO)')).toBe(true);
    expect(profileImpliesCoo('Engineering', 'Khaled COO')).toBe(true);
    expect(profileImpliesCoo('Site Team', 'Omar')).toBe(false);
    expect(profileImpliesCoo(null, null)).toBe(false);
  });

  describe('subscribeToUserProfileChanges (Singleton Realtime Channel Manager)', () => {
    it('creates only 1 channel and attaches callbacks once when multiple components subscribe to same user', () => {
      mockChannel.mockClear();
      mockChannelObj.on.mockClear();
      mockChannelObj.subscribe.mockClear();
      mockRemoveChannel.mockClear();

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = subscribeToUserProfileChanges('user-abc', cb1);
      const unsub2 = subscribeToUserProfileChanges('user-abc', cb2);

      expect(mockChannel).toHaveBeenCalledTimes(1);
      expect(mockChannelObj.on).toHaveBeenCalledTimes(1);
      expect(mockChannelObj.subscribe).toHaveBeenCalledTimes(1);

      unsub1();
      expect(mockRemoveChannel).not.toHaveBeenCalled();

      unsub2();
      expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    });
  });
});

