# ADR-0004: Multi-layer DB keep-alive for Supabase free tier

**Status**: Accepted
**Date**: 2026-08-31

## Context

Supabase free-tier projects pause after 7 days of inactivity. The portal needed a strategy to prevent this without upgrading the plan.

## Decision

Three-layer keep-alive:

1. **Client-side** (`src/components/common/DbKeepAlive.tsx`): Mounted in root layout. Pings `/api/keep-alive` once per session with a 15-minute throttle via `sessionStorage`.
2. **Vercel Cron** (`vercel.json`): Calls `GET /api/keep-alive` daily at 04:00 UTC.
3. **GitHub Actions** (`.github/workflows/supabase-keep-alive.yml`): Pings the Supabase REST API directly every 3 days.

The API route (`src/app/api/keep-alive/route.ts`) runs a lightweight `SELECT 1` query and reports DB latency.

## Consequences

- Free-tier DB stays alive as long as either Vercel or GitHub Actions is running.
- Client pings are throttled — no extra DB load during normal usage.
- The `/api/keep-alive` endpoint doubles as a health check for uptime monitors.

## Alternatives Considered

- Upgrading Supabase plan — deferred.
- Single-layer cron only — fragile if Vercel deployment is paused.
