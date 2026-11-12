import { describe, it, expect, vi } from 'vitest';
import { unwrap, assertRows } from '../supabase/unwrap';
import { AppCache } from '../cache';
import { ProjectService } from '../services/project.service';

const { mockSupabase } = vi.hoisted(() => {
  const mock = {
    from: vi.fn(),
    rpc: vi.fn(),
  };
  return { mockSupabase: mock };
});

vi.mock('../supabase/client', () => ({
  supabase: mockSupabase,
  createSupabaseBrowserClient: () => mockSupabase,
  createHrDbClient: () => mockSupabase,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Phase 2: Error Visibility & Robustness', () => {
  describe('unwrap helper', () => {
    it('returns data when error is null', () => {
      const res = { data: [{ id: 'proj-1' }], error: null };
      const data = unwrap(res, 'fetchProjects');
      expect(data).toEqual([{ id: 'proj-1' }]);
    });

    it('throws descriptive error when Supabase error is present', () => {
      const res = { data: null, error: { message: 'permission denied for table projects' } };
      expect(() => unwrap(res, 'fetchProjects')).toThrow(
        'fetchProjects: permission denied for table projects'
      );
    });

    it('handles details when message is empty', () => {
      const res = { data: null, error: { message: '', details: 'RLS policy violation' } };
      expect(() => unwrap(res as any, 'fetchProjects')).toThrow(
        'fetchProjects: RLS policy violation'
      );
    });
  });

  describe('assertRows helper', () => {
    it('returns rows when non-empty array is passed', () => {
      const rows = [{ id: 'proj-1' }];
      expect(assertRows(rows, 'archiveProject')).toEqual(rows);
    });

    it('throws when rows is empty array (e.g. 0 rows updated due to RLS)', () => {
      expect(() => assertRows([], 'archiveProject')).toThrow(
        'archiveProject: no rows changed (permission?)'
      );
    });

    it('throws when rows is null or undefined', () => {
      expect(() => assertRows(null, 'restoreProject')).toThrow(
        'restoreProject: no rows changed (permission?)'
      );
      expect(() => assertRows(undefined, 'restoreProject')).toThrow(
        'restoreProject: no rows changed (permission?)'
      );
    });
  });

  describe('AppCache error & concurrency handling', () => {
    it('does not cache rejected fetcher results', async () => {
      const cache = new AppCache();
      let callCount = 0;
      const failingFetcher = async () => {
        callCount++;
        throw new Error('Network error');
      };

      await expect(cache.getOrFetch('test-err-key', failingFetcher)).rejects.toThrow('Network error');
      expect(cache.get('test-err-key')).toBeNull();

      // Second call must call fetcher again rather than returning cached error
      await expect(cache.getOrFetch('test-err-key', failingFetcher)).rejects.toThrow('Network error');
      expect(callCount).toBe(2);
    });

    it('D12: finally block deletes inflight entry only if it is still the same promise', async () => {
      const cache = new AppCache();
      let resolveFirst: (v: string) => void;
      const firstPromise = new Promise<string>((res) => {
        resolveFirst = res;
      });

      // Start first fetcher
      const p1 = cache.getOrFetch('race-key', () => firstPromise);
      expect(cache.inflight.get('race-key')).toBeDefined();

      // Simulate a newer promise taking over the inflight slot (e.g. via re-fetch or manual set)
      const secondPromise = Promise.resolve('second');
      cache.inflight.set('race-key', secondPromise);

      // Now resolve the first fetcher
      resolveFirst!('first');
      await p1;

      // The inflight entry should NOT have been deleted by p1's finally, because it was replaced!
      expect(cache.inflight.get('race-key')).toBe(secondPromise);
    });
  });

  describe('Service Error Propagation', () => {
    it('P9: archiveProject throws when 0 rows are updated by Supabase (e.g. RLS block)', async () => {
      // Mock getProjectById to succeed
      vi.spyOn(ProjectService, 'getProjectById').mockResolvedValue({
        id: 'proj-123',
        project_name: 'Test Project',
        project_code: '2601',
      } as any);

      // Mock update to return empty rows (0 rows updated)
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      await expect(ProjectService.archiveProject('proj-123', 'admin')).rejects.toThrow(
        'archiveProject: no rows changed (permission?)'
      );
    });

    it('P9: restoreProject throws when 0 rows are updated by Supabase', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      await expect(ProjectService.restoreProject('proj-123')).rejects.toThrow(
        'restoreProject: no rows changed (permission?)'
      );
    });
  });
});
