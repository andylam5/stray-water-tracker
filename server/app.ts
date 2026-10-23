import { createHash } from 'node:crypto';
import { getConnInfo } from '@hono/node-server/conninfo';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { WeeklyReadRequestSchema, type WeeklyRead, type WeeklyReadError } from '../src/lib/weeklyReadTypes.ts';
import { dailyBudget, promiseCache, rateLimiter } from './guards.ts';
import { DEFAULT_MODEL, generateWeeklyRead, WeeklyReadFailure } from './weeklyRead.ts';

export type Env = Record<string, string | undefined>;

const MAX_BODY_BYTES = 64 * 1024;
/** Per IP. A visit reads the week plus up to seven days, so this allows a few visits. */
const READS_PER_WINDOW = 30;
const WINDOW_MS = 10 * 60_000;
/** Same log, same read: keep results for a day. The example week is shared by everyone. */
const CACHE_TTL_MS = 24 * 60 * 60_000;
const CACHE_MAX = 1000;
const DEFAULT_DAILY_LIMIT = 500;

/**
 * Client IP. Behind a host's proxy (TRUST_PROXY=1) every connection comes from the
 * proxy, so use the first X-Forwarded-For entry. A client can spoof that header to
 * dodge the per-IP limit, but not the daily budget, which is the real spending cap.
 */
function clientIp(c: Context, trustProxy: boolean) {
  const forwarded = trustProxy ? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
  if (forwarded) return forwarded;
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/** The JSON API. Used by the production server and mounted into Vite in development. */
export function createApi(env: Env) {
  const limiter = rateLimiter(READS_PER_WINDOW, WINDOW_MS);
  const budget = dailyBudget(Number(env.GEMINI_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT);
  const cache = promiseCache<WeeklyRead>(CACHE_MAX, CACHE_TTL_MS);
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const trustProxy = env.TRUST_PROXY === '1';

  const fail = (c: Context, f: WeeklyReadFailure) =>
    c.json<WeeklyReadError>({ error: f.message, code: f.code }, f.status as ContentfulStatusCode);

  const api = new Hono().basePath('/api');

  api.get('/health', (c) => c.json({ ok: true, ai: Boolean(env.GEMINI_API_KEY) }));

  api.post(
    '/weekly-read',
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => fail(c, new WeeklyReadFailure(413, 'bad_request', 'Request too large')),
    }),
    async (c) => {
      if (!limiter.hit(clientIp(c, trustProxy))) {
        return fail(c, new WeeklyReadFailure(429, 'rate_limited', 'Too many reads, try again in a few minutes'));
      }
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) return fail(c, new WeeklyReadFailure(503, 'not_configured', 'GEMINI_API_KEY is not set'));

      const parsed = WeeklyReadRequestSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return fail(c, new WeeklyReadFailure(400, 'bad_request', 'Invalid weekly read request'));

      // Key on the validated request, so unknown fields can't dodge the cache.
      const key = createHash('sha256').update(model).update(JSON.stringify(parsed.data)).digest('hex');
      const { value, hit } = cache.get(key, () => {
        if (!budget.take()) {
          return Promise.reject(new WeeklyReadFailure(429, 'rate_limited', 'Daily AI budget used up'));
        }
        return generateWeeklyRead(parsed.data, apiKey, model);
      });
      try {
        const read = await value;
        c.header('X-Cache', hit ? 'hit' : 'miss');
        return c.json<WeeklyRead>(read);
      } catch (e) {
        const f = e instanceof WeeklyReadFailure ? e : new WeeklyReadFailure(502, 'upstream', (e as Error).message);
        if (f.code === 'upstream') console.error('[weekly-read]', f.message);
        return fail(c, f);
      }
    },
  );

  return api;
}
