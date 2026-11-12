'use client';

import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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

export interface ModuleAccessRecord {
  id: string;
  module_path: string;
  allowed_roles: string[];
  edit_roles: string[];
}

export function useModuleAccess() {
  const queryClient = useSafeQueryClient();
  return useQuery(
    {
      queryKey: ['contract_module_access'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('contract_module_access')
          .select('id, module_path, allowed_roles, edit_roles');

        if (error) {
          logger.warn('[useModuleAccess] Table not found or unreadable, using fallback roles', { detail: error.message });
          return null;
        }
        return data as ModuleAccessRecord[];
      },
      retry: (failureCount, error: any) => {
        if (/does not exist|schema cache|Could not find/i.test(error?.message || '')) return false;
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,
    },
    queryClient
  );
}
