/**
 * E2E auth-bypass guard for middleware.
 *
 * The bypass lets automated Playwright runs skip the login gate. It must NEVER
 * be reachable on a real deployment, so it is OFF by default and requires a
 * SERVER-SIDE flag that only the Playwright web server sets
 * (see playwright.config.ts → webServer.env).
 *
 * Rules (all must hold):
 *  1. PZONE_E2E_ENABLED === 'true' on the server.
 *  2. Not running on Vercel (VERCEL !== '1' and VERCEL_ENV !== 'production').
 *  3. The request carries the marker: header `x-pzone-e2e: true`
 *     or cookie `pzone-e2e-bypass=true`.
 */

export interface E2ERequestLike {
  header(name: string): string | null | undefined;
  cookie(name: string): string | undefined;
}

export type E2EEnv = Record<string, string | undefined>;

export const E2E_HEADER = 'x-pzone-e2e';
export const E2E_COOKIE = 'pzone-e2e-bypass';

export function isE2EBypassAllowed(req: E2ERequestLike, env: E2EEnv): boolean {
  if (env.PZONE_E2E_ENABLED !== 'true') return false;
  if (env.VERCEL === '1' || env.VERCEL_ENV === 'production') return false;

  return req.header(E2E_HEADER) === 'true' || req.cookie(E2E_COOKIE) === 'true';
}
