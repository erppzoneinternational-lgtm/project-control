import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// We need to mock fetch and env before importing the route
const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

// Helper to create a NextRequest
function makeRequest(headers: Record<string, string> = {}, method = 'GET') {
  const url = 'http://localhost/api/keep-alive';
  return new NextRequest(url, { method, headers });
}

// Helper to set env vars
function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

describe('GET /api/keep-alive', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    // Reset rate limit map by reimporting fresh module each test
  });

  afterEach(() => {
    // Restore env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it('returns 401 without secret header', async () => {
    setEnv({
      KEEP_ALIVE_SECRET: 'my-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    });

    const { GET } = await import('../keep-alive/route');
    const req = makeRequest({}); // no x-keep-alive-secret
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 with wrong secret', async () => {
    setEnv({
      KEEP_ALIVE_SECRET: 'correct-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    });

    const { GET } = await import('../keep-alive/route');
    const req = makeRequest({ 'x-keep-alive-secret': 'wrong-secret' });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 503 (not raw error) when DB fetch fails', async () => {
    setEnv({
      KEEP_ALIVE_SECRET: 'my-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    });

    mockFetch.mockRejectedValueOnce(new Error('Connection timeout - internal detail'));

    const { GET } = await import('../keep-alive/route');
    const req = makeRequest({ 'x-keep-alive-secret': 'my-secret' });
    const res = await GET(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    // Must NOT expose raw error message
    expect(body.error).toBe('Service unavailable');
    expect(JSON.stringify(body)).not.toContain('Connection timeout');
  });

  it('returns 429 after RATE_LIMIT requests from same IP', async () => {
    setEnv({
      KEEP_ALIVE_SECRET: 'my-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    });

    // Mock successful fetch for all calls
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"status":"ok"}',
      json: async () => ({ status: 'ok' }),
    });

    const { GET } = await import('../keep-alive/route');

    const ip = '10.0.0.1-rate-test-' + Date.now(); // unique IP to avoid cross-test pollution
    const headers = { 'x-keep-alive-secret': 'my-secret', 'x-forwarded-for': ip };

    // First 10 requests should succeed
    for (let i = 0; i < 10; i++) {
      const req = makeRequest(headers);
      const res = await GET(req);
      expect(res.status).toBe(200);
    }

    // 11th request should be rate-limited
    const req = makeRequest(headers);
    const res = await GET(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Too many requests');
  });

  it('accepts Vercel Cron Authorization Bearer token when CRON_SECRET is set', async () => {
    setEnv({
      CRON_SECRET: 'vercel-cron-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '{"status":"ok"}',
      json: async () => ({ status: 'ok' }),
    });

    const { GET } = await import('../keep-alive/route');
    const ip = '10.0.0.2-cron-test-' + Date.now();
    const req = makeRequest({
      authorization: 'Bearer vercel-cron-secret',
      'x-forwarded-for': ip,
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
