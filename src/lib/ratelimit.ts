import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting via Upstash Redis (REST — funciona em serverless).
 * Fail-open: sem as envs UPSTASH_REDIS_REST_URL/TOKEN (ex.: dev local) ou
 * com o Redis fora do ar, o tráfego passa — proteção não pode virar outage.
 */
const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const purchaseLimiter = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:purchase'
    })
  : null;

const rsvpLimiter = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(8, '1 m'),
      prefix: 'rl:rsvp'
    })
  : null;

async function check(limiter: Ratelimit | null, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return true;
  }
}

export const allowPurchase = (ip: string) => check(purchaseLimiter, ip);
export const allowRsvp = (ip: string) => check(rsvpLimiter, ip);

/** Extrai o IP real atrás do proxy da Vercel. */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
