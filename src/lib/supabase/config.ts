// Shared settings for every Supabase client in this app. The session is a cookie on the parent
// domain, shared with the Portal and every company system (SSO).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
export const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'project_control';
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://erp.pzoneinternational.com';
export const SYSTEM_SLUG = 'project_control';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing');
}
if (SUPABASE_KEY.startsWith('sb_secret_') || SUPABASE_KEY.includes('service_role')) {
  throw new Error('[Supabase] A secret key was configured. Use the publishable key.');
}

// MUST stay exactly like this. Identical in every company app.
export const cookieOptions = {
  domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 400 * 24 * 60 * 60,
};

export function portalLoginUrl(returnTo: string): string {
  return `${PORTAL_URL}/login?redirect=${encodeURIComponent(returnTo)}`;
}
