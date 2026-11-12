# ADR-0001: RLS service_role bypass in RPCs

**Status**: Accepted
**Date**: 2026-08-31

## Context

Supabase RPCs (e.g. `rpc_site_task_transition`) use `auth.uid()` to determine if the caller is a PM, admin, or assignee. When called from a cron job, GitHub Actions, or a service-role Node.js script, `auth.uid()` returns `NULL` — causing the RPC to reject all transitions.

## Decision

When `auth.uid() IS NULL`, grant all role flags (`v_is_pm_or_admin`, `v_is_assignee`, `v_is_qc_assigned`) as `TRUE`. This allows system/service operations to bypass the role gate.

## Consequences

- System scripts and cron jobs can transition tasks without a logged-in user.
- Any caller with a `service_role` JWT key has full RPC access — guard the service key.
- Applied in migration `025_unified_task_transition_rpc.sql`.

## Alternatives Considered

- Requiring a dedicated system user in `auth.users` — rejected (unnecessary complexity for cron ops).
