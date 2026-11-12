/**
 * Environment detection utility.
 * Distinguishes between local development and cloud/production deployment (e.g. Vercel).
 */

export const isDeploymentEnv = (): boolean => {
  // If explicitly injected via Next.js env config during build/runtime
  if (process.env.NEXT_PUBLIC_IS_DEPLOYMENT === 'true') {
    return true;
  }

  // Server-side check: VERCEL flag is set on all Vercel deployments
  if (typeof window === 'undefined') {
    return process.env.VERCEL === '1';
  }

  // Client-side check: non-localhost/non-127.0.0.1 hostname implies live deployment
  const hostname = window.location.hostname;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local');

  return !isLocalHost;
};

export const isLocalDevEnv = (): boolean => {
  return !isDeploymentEnv();
};
