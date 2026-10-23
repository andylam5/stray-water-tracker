// In-memory protections for the Gemini endpoint. They reset on restart and aren't
// shared between instances, which is fine for one small server; move them to Redis
// or Postgres once there's more than one.

/** Fixed-window counter per key (an IP address): at most `limit` hits per `windowMs`. */
export function rateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    /** Records a hit; false when the key is over its limit. */
    hit(key: string, now = Date.now()) {
      const w = windows.get(key);
      if (!w || now - w.start >= windowMs) {
        // Drop expired windows now and then so the map can't grow forever.
        if (windows.size > 10_000) {
          for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
        }
        windows.set(key, { start: now, count: 1 });
        return true;
      }
      w.count++;
      return w.count <= limit;
    },
  };
}

/** Caps calls per UTC day across everyone, so a leaked link can't run up the bill. */
export function dailyBudget(limit: number) {
  let day = '';
  let used = 0;
  return {
    /** Spends one call; false when today's budget is gone. */
    take(now = new Date()) {
      const today = now.toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        used = 0;
      }
      if (used >= limit) return false;
      used++;
      return true;
    },
  };
}

/**
 * Caches results by key for `ttlMs`, oldest evicted first past `max` entries. Storing
 * the promise means identical requests that arrive together share one upstream call.
 * Failures are dropped so the next request retries.
 */
export function promiseCache<T>(max: number, ttlMs: number) {
  const entries = new Map<string, { expires: number; value: Promise<T> }>();
  return {
    get(key: string, load: () => Promise<T>, now = Date.now()): { value: Promise<T>; hit: boolean } {
      const found = entries.get(key);
      if (found && found.expires > now) return { value: found.value, hit: true };
      entries.delete(key);
      const value = load();
      entries.set(key, { expires: now + ttlMs, value });
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key);
      });
      // Maps keep insertion order, so the first key is the oldest.
      while (entries.size > max) entries.delete(entries.keys().next().value!);
      return { value, hit: false };
    },
  };
}
