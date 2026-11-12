import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { renderToString } from 'react-dom/server';
import RootErrorBoundary from '@/app/error';
import DashboardErrorBoundary from '@/app/(dashboard)/error';

const mockGetUser = vi.fn();
let forceExpandErrorDetails = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    default: actual,
    useState: ((initial: unknown) => {
      if (forceExpandErrorDetails && initial === false) {
        return [true, vi.fn()];
      }
      return actual.useState(initial);
    }) as typeof actual.useState,
  };
});
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockSignInWithIdToken = vi.fn();
const mockAdminFrom = vi.fn();
const mockUpdateSession = vi.fn();
const mockChatJSON = vi.fn();
const mockResolveAiCredential = vi.fn();
const mockCreateClientFromJs = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      verifyOtp: mockVerifyOtp,
      exchangeCodeForSession: mockExchangeCodeForSession,
      signInWithIdToken: mockSignInWithIdToken,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock('@/lib/ai/providers', () => ({
  AI_PROVIDERS: {
    gemini: { label: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
    openai: { label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
    openrouter: { label: 'OpenRouter', defaultModel: 'google/gemini-2.5-flash' },
  },
  chatJSON: (...args: unknown[]) => mockChatJSON(...args),
  resolveAiCredential: (...args: unknown[]) => mockResolveAiCredential(...args),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClientFromJs(...args),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/planning',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

/**
 * Builds a fluent chainable Supabase query mock resolving to `result`.
 */
function buildQueryChain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'in',
    'is',
    'or',
    'gte',
    'lte',
    'not',
    'order',
    'limit',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.then = (onFulfilled: (val: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return chain;
}

describe('Security Hardening Routes & Boundaries (SEC-01..SEC-05, SEC-09, SEC-10)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_KEY_ENCRYPTION_SECRET = 'test-encryption-secret-for-routes';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  // ── SEC-01: POST /api/planning/activities/import ─────────────────────────
  describe('SEC-01: POST /api/planning/activities/import', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const { POST } = await import('../planning/activities/import/route');
      const req = new NextRequest('http://localhost/api/planning/activities/import', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'proj-1', activities: [{ name_ar: 'حفر' }] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 when profile is inactive or viewer-only', async () => {
      const { POST } = await import('../planning/activities/import/route');

      // Case A: inactive account
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-inactive' } }, error: null });
      mockAdminFrom.mockImplementationOnce(() =>
        buildQueryChain({
          data: { roles: ['planning_engineer'], is_active: false, status: 'suspended' },
          error: null,
        })
      );
      const resInactive = await POST(
        new NextRequest('http://localhost/api/planning/activities/import', {
          method: 'POST',
          body: JSON.stringify({ projectId: 'proj-1', activities: [{ name_ar: 'حفر' }] }),
        })
      );
      expect(resInactive.status).toBe(403);

      // Case B: active viewer-only account
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-viewer' } }, error: null });
      mockAdminFrom.mockImplementationOnce(() =>
        buildQueryChain({
          data: { roles: ['viewer'], is_active: true, status: 'active' },
          error: null,
        })
      );
      const resViewer = await POST(
        new NextRequest('http://localhost/api/planning/activities/import', {
          method: 'POST',
          body: JSON.stringify({ projectId: 'proj-1', activities: [{ name_ar: 'حفر' }] }),
        })
      );
      expect(resViewer.status).toBe(403);
    });

    it('returns 403 when scoped planning_engineer only has view access to project', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-scoped' } }, error: null });
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return buildQueryChain({
            data: {
              roles: ['planning_engineer'],
              is_active: true,
              status: 'active',
              project_scope_mode: 'assigned',
            },
            error: null,
          });
        }
        if (table === 'pm_user_project_access') {
          return buildQueryChain({
            data: { access_level: 'view' },
            error: null,
          });
        }
        return buildQueryChain();
      });

      const { POST } = await import('../planning/activities/import/route');
      const res = await POST(
        new NextRequest('http://localhost/api/planning/activities/import', {
          method: 'POST',
          body: JSON.stringify({ projectId: 'proj-1', activities: [{ name_ar: 'حفر' }] }),
        })
      );
      expect(res.status).toBe(403);
    });

    it('returns 413 when activities batch exceeds 5000 items', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-admin' } }, error: null });
      mockAdminFrom.mockImplementation(() =>
        buildQueryChain({
          data: { roles: ['admin'], is_active: true, status: 'active' },
          error: null,
        })
      );

      const { POST } = await import('../planning/activities/import/route');
      const oversized = Array.from({ length: 5001 }, (_, i) => ({ code: `A-${i}` }));
      const res = await POST(
        new NextRequest('http://localhost/api/planning/activities/import', {
          method: 'POST',
          body: JSON.stringify({ projectId: 'proj-1', activities: oversized }),
        })
      );
      expect(res.status).toBe(413);
    });

    it('whitelists columns and strips arbitrary injected properties on insert', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-plan-eng' } }, error: null });

      let capturedInsertedChunk: Array<Record<string, unknown>> = [];

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return buildQueryChain({
            data: {
              roles: ['planning_engineer'],
              is_active: true,
              status: 'active',
              project_scope_mode: 'assigned',
            },
            error: null,
          });
        }
        if (table === 'pm_user_project_access') {
          return buildQueryChain({
            data: { access_level: 'manage' },
            error: null,
          });
        }
        if (table === 'pm_project_activities') {
          const chain = buildQueryChain({
            data: [{ id: 'act-uuid-1', code: 'A100', activity_code: 'A100' }],
            error: null,
          });
          chain.insert = vi.fn((chunk: Array<Record<string, unknown>>) => {
            capturedInsertedChunk = chunk;
            return chain;
          });
          return chain;
        }
        if (table === 'pm_schedule_versions') {
          return buildQueryChain({ data: { id: 'ver-1', version_no: 1 }, error: null });
        }
        return buildQueryChain({ data: [], error: null });
      });

      const { POST } = await import('../planning/activities/import/route');
      const res = await POST(
        new NextRequest('http://localhost/api/planning/activities/import', {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'proj-verified',
            activities: [
              {
                project_id: 'proj-spoofed-by-attacker',
                id: 'spoofed-uuid',
                code: 'A100',
                name_ar: 'صب خرسانة',
                wbs_code: 'WBS.01',
                injected_evil_col: 'DROP TABLE profiles;',
                __proto_pollute__: true,
              },
            ],
          }),
        })
      );

      expect(res.status).toBe(200);
      expect(capturedInsertedChunk).toHaveLength(1);
      expect(capturedInsertedChunk[0].project_id).toBe('proj-verified');
      expect(capturedInsertedChunk[0].name_ar).toBe('صب خرسانة');
      expect(capturedInsertedChunk[0]).not.toHaveProperty('injected_evil_col');
      expect(capturedInsertedChunk[0]).not.toHaveProperty('__proto_pollute__');
      expect(capturedInsertedChunk[0]).not.toHaveProperty('id');
      expect(capturedInsertedChunk[0]).not.toHaveProperty('wbs_code');
    });
  });

  // ── SEC-02: GET /api/planning/pulse-project ──────────────────────────────
  describe('SEC-02: GET /api/planning/pulse-project', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const { GET } = await import('../planning/pulse-project/route');
      const res = await GET(new NextRequest('http://localhost/api/planning/pulse-project'));
      expect(res.status).toBe(401);
    });

    it('returns 403 for viewer role lacking /planning access', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-viewer' } }, error: null });
      mockAdminFrom.mockImplementationOnce(() =>
        buildQueryChain({
          data: { roles: ['viewer'], is_active: true, status: 'active' },
          error: null,
        })
      );
      const { GET } = await import('../planning/pulse-project/route');
      const res = await GET(new NextRequest('http://localhost/api/planning/pulse-project'));
      expect(res.status).toBe(403);
    });

    it('returns 403 when scoped planning user requests an unassigned projectId', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'u-scoped', email: 'eng@pzone.com' } },
        error: null,
      });
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return buildQueryChain({
            data: {
              roles: ['planning_engineer'],
              is_active: true,
              status: 'active',
              project_scope_mode: 'assigned',
            },
            error: null,
          });
        }
        if (table === 'pm_user_project_access') {
          return buildQueryChain({ data: [{ project_id: 'proj-allowed' }], error: null });
        }
        if (table === 'stakeholders') {
          return buildQueryChain({ data: [], error: null });
        }
        return buildQueryChain({ data: [], error: null });
      });

      const { GET } = await import('../planning/pulse-project/route');
      const res = await GET(
        new NextRequest('http://localhost/api/planning/pulse-project?projectId=proj-other')
      );
      expect(res.status).toBe(403);
    });

    it('returns 200 when scoped planning user requests an assigned projectId', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'u-scoped', email: 'eng@pzone.com' } },
        error: null,
      });
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return buildQueryChain({
            data: {
              roles: ['planning_engineer'],
              is_active: true,
              status: 'active',
              project_scope_mode: 'assigned',
            },
            error: null,
          });
        }
        if (table === 'pm_user_project_access') {
          return buildQueryChain({ data: [{ project_id: 'proj-allowed' }], error: null });
        }
        if (table === 'stakeholders') {
          return buildQueryChain({ data: [], error: null });
        }
        if (table === 'pm_projects') {
          return buildQueryChain({
            data: {
              id: 'proj-allowed',
              project_code: '2402',
              project_name: 'Lagoon 1',
              planned_start_date: '2026-01-01',
              planned_finish_date: '2026-12-31',
            },
            error: null,
          });
        }
        return buildQueryChain({ data: [], error: null });
      });

      const { GET } = await import('../planning/pulse-project/route');
      const res = await GET(
        new NextRequest('http://localhost/api/planning/pulse-project?projectId=proj-allowed')
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.projectId).toBe('proj-allowed');
    });
  });

  // ── SEC-03 & SEC-05: Middleware, /auth/callback, /auth/confirm ───────────
  describe('SEC-03 & SEC-05: Auth Routes, Open Redirect Guards & Middleware PUBLIC_ROUTES', () => {
    it('allows unauthenticated access to /auth/confirm and /auth/callback in middleware', async () => {
      const passthrough = NextResponse.next();
      mockUpdateSession.mockResolvedValue({ user: null, supabaseResponse: passthrough });

      const { middleware } = await import('@/middleware');

      const confirmRes = await middleware(
        new NextRequest('http://localhost/auth/confirm?token_hash=abc&type=recovery')
      );
      expect(confirmRes.headers.get('location')).toBeNull();

      const callbackRes = await middleware(
        new NextRequest('http://localhost/auth/callback?code=pkce-123')
      );
      expect(callbackRes.headers.get('location')).toBeNull();

      const protectedRes = await middleware(new NextRequest('http://localhost/planning'));
      expect(protectedRes.headers.get('location')).toContain('/login?redirect=%2Fplanning');
    });

    it('redirects google_local OAuth flow to /login?error=oauth_config_missing when Google env vars are absent', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const { GET } = await import('@/app/auth/callback/route');
      const res = await GET(
        new Request('https://projectcontrol.pzoneinternational.com/auth/callback?code=abc&state=google_local:/projects')
      );
      expect(res.headers.get('location')).toBe(
        'https://projectcontrol.pzoneinternational.com/login?error=oauth_config_missing'
      );
    });

    it('blocks open redirects (//evil.com, /\\evil.com, /@evil.com) and untrusted x-forwarded-host in /auth/callback', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      mockExchangeCodeForSession.mockResolvedValue({ error: null });

      const { GET } = await import('@/app/auth/callback/route');

      for (const maliciousNext of [
        '//evil.com',
        '/\\evil.com',
        '/path@evil.com',
        'https://evil.com/phish',
      ]) {
        const url = `https://internal.local/auth/callback?code=ok&next=${encodeURIComponent(maliciousNext)}`;
        const res = await GET(
          new Request(url, {
            headers: { 'x-forwarded-host': 'evil.attacker.com' },
          })
        );
        // Untrusted x-forwarded-host ignored + malicious next sanitized to '/'
        expect(res.headers.get('location')).toBe('https://internal.local/');
      }

      // Trusted Vercel preview host + clean internal path succeeds
      const trustedRes = await GET(
        new Request('https://internal.local/auth/callback?code=ok&next=%2Fprojects%2Fdashboard', {
          headers: { 'x-forwarded-host': 'pzone-portal-git-main.vercel.app' },
        })
      );
      expect(trustedRes.headers.get('location')).toBe(
        'https://pzone-portal-git-main.vercel.app/projects/dashboard'
      );
    });

    it('sanitizes next param in /auth/confirm while preserving recovery default', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const { GET } = await import('@/app/auth/confirm/route');

      const evilRes = await GET(
        new NextRequest(
          'https://projectcontrol.pzoneinternational.com/auth/confirm?token_hash=th1&type=signup&next=//evil.com'
        )
      );
      expect(evilRes.headers.get('location')).toBe(
        'https://projectcontrol.pzoneinternational.com/'
      );

      const backslashRes = await GET(
        new NextRequest(
          'https://projectcontrol.pzoneinternational.com/auth/confirm?token_hash=th1&type=signup&next=%2F%5Cevil.com'
        )
      );
      expect(backslashRes.headers.get('location')).toBe(
        'https://projectcontrol.pzoneinternational.com/'
      );

      const recoveryDefaultRes = await GET(
        new NextRequest(
          'https://projectcontrol.pzoneinternational.com/auth/confirm?token_hash=th1&type=recovery'
        )
      );
      expect(recoveryDefaultRes.headers.get('location')).toBe(
        'https://projectcontrol.pzoneinternational.com/reset-password'
      );
    });
  });

  // ── SEC-04: /api/boq/ai-assist & /api/ai/keys ────────────────────────────
  describe('SEC-04: AI Assist & AI Keys Active/Role/Validation/Rate-Limit Guards', () => {
    it('blocks viewer-only and inactive users across /api/ai/keys (GET, POST, DELETE)', async () => {
      const { GET, POST, DELETE } = await import('../ai/keys/route');

      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-viewer' } }, error: null });
      mockAdminFrom.mockImplementation(() =>
        buildQueryChain({
          data: { roles: ['viewer'], is_active: true, status: 'active' },
          error: null,
        })
      );

      expect((await GET()).status).toBe(403);
      expect(
        (
          await POST(
            new NextRequest('http://localhost/api/ai/keys', {
              method: 'POST',
              body: JSON.stringify({ provider: 'gemini', apiKey: 'AIzaSy1234567890' }),
            })
          )
        ).status
      ).toBe(403);
      expect(
        (
          await DELETE(new NextRequest('http://localhost/api/ai/keys?provider=gemini', { method: 'DELETE' }))
        ).status
      ).toBe(403);
    });

    it('validates model regex and apiKey max length <= 512 on POST /api/ai/keys', async () => {
      const { POST } = await import('../ai/keys/route');

      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-est' } }, error: null });
      mockAdminFrom.mockImplementation(() =>
        buildQueryChain({
          data: { roles: ['estimator'], is_active: true, status: 'active' },
          error: null,
        })
      );

      const badModelRes = await POST(
        new NextRequest('http://localhost/api/ai/keys', {
          method: 'POST',
          body: JSON.stringify({
            provider: 'gemini',
            apiKey: 'AIzaSyValidLengthKey12345',
            model: '../evil/model?inject=1',
          }),
        })
      );
      expect(badModelRes.status).toBe(400);

      const hugeKeyRes = await POST(
        new NextRequest('http://localhost/api/ai/keys', {
          method: 'POST',
          body: JSON.stringify({
            provider: 'gemini',
            apiKey: 'k'.repeat(513),
            model: 'gemini-2.5-flash',
          }),
        })
      );
      expect(hugeKeyRes.status).toBe(400);
    });

    it('enforces viewer block, model regex, and 20 req/min rate limit on POST /api/boq/ai-assist', async () => {
      const { POST } = await import('../boq/ai-assist/route');

      // 1. Viewer blocked with 403
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u-viewer-boq' } }, error: null });
      mockAdminFrom.mockImplementationOnce(() =>
        buildQueryChain({
          data: { roles: ['viewer'], is_active: true, status: 'active' },
          error: null,
        })
      );
      const viewerRes = await POST(
        new NextRequest('http://localhost/api/boq/ai-assist', {
          method: 'POST',
          body: JSON.stringify({ action: 'analyze_sheets', sheets: [] }),
        })
      );
      expect(viewerRes.status).toBe(403);

      // 2. Invalid model rejected with 400
      const rateUser = `u-est-rate-${Date.now()}`;
      mockGetUser.mockResolvedValue({ data: { user: { id: rateUser } }, error: null });
      mockAdminFrom.mockImplementation(() =>
        buildQueryChain({
          data: { roles: ['estimator'], is_active: true, status: 'active' },
          error: null,
        })
      );
      mockResolveAiCredential.mockImplementation(async () => ({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: 'AIzaSyMockKey12345',
        source: 'system',
      }));
      mockChatJSON.mockResolvedValue({ sheets: [] });

      const badModelRes = await POST(
        new NextRequest('http://localhost/api/boq/ai-assist', {
          method: 'POST',
          body: JSON.stringify({ action: 'analyze_sheets', model: 'bad/model$name', sheets: [] }),
        })
      );
      expect(badModelRes.status).toBe(400);

      // Remaining 19 requests within the 20/min budget succeed
      for (let i = 0; i < 19; i++) {
        const okRes = await POST(
          new NextRequest('http://localhost/api/boq/ai-assist', {
            method: 'POST',
            body: JSON.stringify({ action: 'analyze_sheets', model: 'gemini-2.5-flash', sheets: [] }),
          })
        );
        expect(okRes.status).toBe(200);
      }

      // 21st request returns 429
      const limitedRes = await POST(
        new NextRequest('http://localhost/api/boq/ai-assist', {
          method: 'POST',
          body: JSON.stringify({ action: 'analyze_sheets', model: 'gemini-2.5-flash', sheets: [] }),
        })
      );
      expect(limitedRes.status).toBe(429);
    });
  });

  // ── SEC-09 & SEC-10: CSP, Cron Secret Constant-Time Auth, Error Stack ────
  describe('SEC-09 & SEC-10: CSP Headers, Cron Auth & Production Stack Suppression', () => {
    it('removes https://*.supabase.co from script-src while keeping it in connect-src and img-src', async () => {
      const nextConfigMod = await import('../../../../next.config');
      const headersConfig = await nextConfigMod.default.headers!();
      const globalHeaders = headersConfig.find((h) => h.source === '/(.*)')?.headers ?? [];
      const csp = globalHeaders.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';

      const directives = Object.fromEntries(
        csp.split(';').map((part) => {
          const trimmed = part.trim();
          const spaceIdx = trimmed.indexOf(' ');
          return [trimmed.slice(0, spaceIdx), trimmed.slice(spaceIdx + 1)];
        })
      );

      expect(directives['script-src']).toBeDefined();
      expect(directives['script-src']).not.toContain('supabase.co');
      expect(directives['connect-src']).toContain('https://*.supabase.co');
      expect(directives['img-src']).toContain('https://*.supabase.co');
    });

    it('verifies constant-time CRON_SECRET auth on GET /api/cron/scheduled-tasks', async () => {
      process.env.CRON_SECRET = 'super-cron-secret-99';
      mockCreateClientFromJs.mockReturnValue({
        from: () => buildQueryChain({ data: [], error: null }),
        rpc: vi.fn(async () => ({ data: [], error: null })),
      });

      const { GET } = await import('../cron/scheduled-tasks/route');

      const missingRes = await GET(new Request('http://localhost/api/cron/scheduled-tasks'));
      expect(missingRes.status).toBe(401);

      const wrongLengthRes = await GET(
        new Request('http://localhost/api/cron/scheduled-tasks', {
          headers: { authorization: 'Bearer short' },
        })
      );
      expect(wrongLengthRes.status).toBe(401);

      const validRes = await GET(
        new Request('http://localhost/api/cron/scheduled-tasks', {
          headers: {
            authorization: 'Bearer super-cron-secret-99',
            'x-forwarded-for': `10.9.9.${Date.now() % 200}`,
          },
        })
      );
      expect(validRes.status).toBe(200);
    });

    it('does not leak error.stack in production renders of RootErrorBoundary and DashboardErrorBoundary even when technical details are expanded', () => {
      forceExpandErrorDetails = true;
      try {
        const sensitiveError = new Error('DB Failure');
        sensitiveError.stack =
          'Error: DB Failure\n    at secretInternalPath (/var/task/secret.js:99:12)';

        // In development, expanded technical details include stack trace
        (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
        const devRootHtml = renderToString(
          React.createElement(RootErrorBoundary, { error: sensitiveError, reset: vi.fn() })
        );
        const devDashHtml = renderToString(
          React.createElement(DashboardErrorBoundary, { error: sensitiveError, reset: vi.fn() })
        );
        expect(devRootHtml).toContain('secretInternalPath');
        expect(devDashHtml).toContain('secretInternalPath');

        // In production, expanded technical details MUST hide error.stack
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        const prodRootHtml = renderToString(
          React.createElement(RootErrorBoundary, { error: sensitiveError, reset: vi.fn() })
        );
        const prodDashHtml = renderToString(
          React.createElement(DashboardErrorBoundary, { error: sensitiveError, reset: vi.fn() })
        );
        expect(prodRootHtml).not.toContain('secretInternalPath');
        expect(prodDashHtml).not.toContain('secretInternalPath');
      } finally {
        forceExpandErrorDetails = false;
      }
    });
  });
});
