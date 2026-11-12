// In-memory Map-based sliding window rate limiter
interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface WindowData {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowData>();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now > data.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitInfo {
  const now = Date.now();
  let data = store.get(key);

  if (!data || now > data.resetAt) {
    data = { count: 0, resetAt: now + windowMs };
  }

  data.count++;
  store.set(key, data);

  return {
    allowed: data.count <= limit,
    remaining: Math.max(0, limit - data.count),
    resetAt: data.resetAt,
  };
}

export function loginRateLimit(email: string) {
  return checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000); // 5 attempts per 15 min
}

export function signupRateLimit(email: string) {
  return checkRateLimit(`signup:${email}`, 3, 60 * 60 * 1000); // 3 attempts per hour
}

export function apiRateLimit(ip: string) {
  return checkRateLimit(`api:${ip}`, 60, 60 * 1000); // 60 requests per minute
}
