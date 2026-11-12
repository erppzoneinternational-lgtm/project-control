import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Bounded in-memory rate limiter ───────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 1000;

function timingSafeSecretEqual(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedDigest = crypto.createHash('sha256').update(providedBuf).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedBuf).digest();
  const digestsEqual = crypto.timingSafeEqual(providedDigest, expectedDigest);
  return providedBuf.length === expectedBuf.length && digestsEqual;
}

function pruneRateLimitMap(now: number): void {
  if (rateLimitMap.size < MAX_RATE_LIMIT_ENTRIES) return;
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) {
      rateLimitMap.delete(k);
    }
  }
  while (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitMap.delete(oldestKey);
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (!entry) {
      pruneRateLimitMap(now);
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/**
 * Health check & Keep-Alive Route Handler
 * Pings Supabase to prevent free-tier project pause.
 * Accepts x-keep-alive-secret header (KEEP_ALIVE_SECRET) or Vercel Cron Bearer token (CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  // ── Fail-closed constant-time auth ─────────────────────────────────────────
  const secret = process.env.KEEP_ALIVE_SECRET;
  const authHeader = request.headers.get('x-keep-alive-secret');
  const cronSecret = process.env.CRON_SECRET;
  const bearerHeader = request.headers.get('authorization');

  const validKeepAliveHeader = Boolean(secret && timingSafeSecretEqual(authHeader, secret));
  const validCronBearer = Boolean(
    cronSecret && timingSafeSecretEqual(bearerHeader, `Bearer ${cronSecret}`)
  );

  if (!validKeepAliveHeader && !validCronBearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rawIp = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ip = rawIp.split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const start = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    // Direct lightweight RPC request to keep database active
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/rpc_health_ping`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      console.error('[keep-alive] internal error: upstream returned', response.status);
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase database is alive and active',
      latencyMs,
      timestamp: new Date().toISOString(),
      service: 'Pzone Portal Keep-Alive',
    });
  } catch (error) {
    console.error('[keep-alive] internal error:', error); // server-side only
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
