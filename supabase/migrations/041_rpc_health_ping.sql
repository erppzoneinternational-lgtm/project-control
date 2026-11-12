-- ============================================================================
-- Migration 041: Health Check & Keep-Alive RPC
-- Pzone International ERP
-- Date: 2026-09-13
-- Purpose: Lightweight ping function that executes a real database query to
--          prevent Supabase free-tier inactivity auto-pause.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_health_ping()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS 
  SELECT jsonb_build_object(
    'status', 'ok',
    'timestamp', now(),
    'db', current_database()
  );
;

-- Allow anon and authenticated users to invoke the health check ping
GRANT EXECUTE ON FUNCTION public.rpc_health_ping() TO anon, authenticated, service_role;
