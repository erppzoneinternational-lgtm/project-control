'use client';

import { useEffect } from 'react';
import { DbKeepAliveService } from '@/lib/services/dbKeepAlive.service';
import { supabase } from '@/lib/supabase';

const PING_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'pzone_last_db_ping';
const AUTH_PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Lightweight background component that mounts in the application shell.
 * Automatically pings the database periodically during active user sessions
 * to prevent cold-starts and database pause.
 */
export function DbKeepAlive() {
  useEffect(() => {
    const pingIfNeeded = async () => {
      try {
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (AUTH_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          return;
        }

        const lastPing = sessionStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (!lastPing || now - parseInt(lastPing, 10) > PING_INTERVAL_MS) {
          sessionStorage.setItem(STORAGE_KEY, now.toString());
          const res = await DbKeepAliveService.pingDatabase();
          if (process.env.NODE_ENV === 'development' && res.ok) {
            console.debug(`[DbKeepAlive] Database ping OK (${res.latencyMs}ms)`);
          }
        }
      } catch {
        // Silent fail in background
      }
    };

    // Initial check on mount
    pingIfNeeded();

    // Set recurring timer
    const interval = setInterval(pingIfNeeded, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
