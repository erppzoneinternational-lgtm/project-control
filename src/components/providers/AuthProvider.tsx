'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

/**
 * AuthProvider — initializes Supabase auth listener.
 * Place once in layout.tsx, wraps children.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = useAuthStore.getState().init();
    return cleanup;
  }, []);

  return <>{children}</>;
}
