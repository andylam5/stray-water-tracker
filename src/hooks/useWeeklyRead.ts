import { useEffect, useState } from 'react';
import type { WeeklyRead, WeeklyReadError, WeeklyReadRequest } from '../lib/weeklyReadTypes';

type State =
  | { status: 'loading' }
  | { status: 'ready'; read: WeeklyRead }
  | { status: 'error'; code: WeeklyReadError['code'] };

/** Reads already generated this session, so revisiting a day doesn't call Gemini again. */
const cache = new Map<string, WeeklyRead>();

/** Fetches Stray's read for the week (focus null) or one day. */
export function useWeeklyRead(request: WeeklyReadRequest) {
  const key = JSON.stringify(request);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: State } | null>(null);

  useEffect(() => {
    if (cache.has(key)) return;
    const controller = new AbortController();
    fetch('/api/weekly-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: key,
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (res.ok && body?.comments) {
          cache.set(key, body as WeeklyRead);
          setResult({ key, state: { status: 'ready', read: body } });
        } else {
          setResult({ key, state: { status: 'error', code: (body as WeeklyReadError | null)?.code ?? 'upstream' } });
        }
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setResult({ key, state: { status: 'error', code: 'upstream' } });
      });
    return () => controller.abort();
  }, [key, attempt]);

  const cached = cache.get(key);
  const state: State = cached
    ? { status: 'ready', read: cached }
    : result?.key === key
      ? result.state
      : { status: 'loading' };

  const retry = () => {
    setResult(null);
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
