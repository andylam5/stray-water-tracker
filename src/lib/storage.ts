import { useSyncExternalStore } from 'react';
import { unitHelpers, type Unit } from './units';
import { DEFAULT_ENABLED, DEFAULT_GOAL_ML, DRINKS, hydrationMl, type DrinkKey } from './drinks';
import { languageFor, type LangId } from './i18n';

const PREFIX = 'stray.';
const CHANGE_EVENT = 'stray-storage';

export function readKey(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeKey(key: string, value: string) {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage can be unavailable (private mode); the app still works for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Removes every `stray.*` key except the ones listed (without the prefix). */
export function clearStorage(except: string[] = []) {
  try {
    const keep = new Set(except.map((k) => PREFIX + k));
    const ls = window.localStorage;
    const keys = Array.from({ length: ls.length }, (_, i) => ls.key(i));
    for (const key of keys) if (key?.startsWith(PREFIX) && !keep.has(key)) ls.removeItem(key);
  } catch {
    // Storage unavailable: nothing was saved, so there's nothing to clear.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function useStoredKey(key: string) {
  return useSyncExternalStore(subscribe, () => readKey(key));
}

export const DEFAULT_FIRST_SIP_ML = 330;

let enabledCache: { raw: string | null; list: DrinkKey[] } = { raw: null, list: DEFAULT_ENABLED };

/** Drinks shown on the Home row, in catalog order. Water is always included. */
function parseEnabled(raw: string | null): DrinkKey[] {
  if (raw === enabledCache.raw) return enabledCache.list;
  let list: DrinkKey[] = DEFAULT_ENABLED;
  try {
    const parsed = JSON.parse(raw ?? 'null');
    if (Array.isArray(parsed)) list = parsed.filter((k): k is DrinkKey => k in DRINKS);
  } catch {
    // Fall back to the defaults.
  }
  if (!list.includes('water')) list = ['water', ...list];
  enabledCache = { raw, list };
  return list;
}

/** App preferences, kept in sync across screens and tabs. */
export function usePrefs() {
  const unit: Unit = useStoredKey('unit') === 'oz' ? 'oz' : 'ml';
  const firstSip = Number(useStoredKey('firstSip')) || DEFAULT_FIRST_SIP_ML;
  const goal = Number(useStoredKey('goal')) || DEFAULT_GOAL_ML;
  const language = languageFor(useStoredKey('lang'));
  const enabledDrinks = parseEnabled(useStoredKey('drinks'));
  const reminders = useStoredKey('reminders') !== 'off';
  return {
    unit,
    firstSip,
    goal,
    language,
    enabledDrinks,
    reminders,
    units: unitHelpers(unit, language.id),
    setUnit: (u: Unit) => writeKey('unit', u),
    setFirstSip: (ml: number) => writeKey('firstSip', String(Math.round(ml))),
    setGoal: (ml: number) => writeKey('goal', String(Math.round(ml))),
    setLanguage: (id: LangId) => writeKey('lang', id),
    setEnabledDrinks: (keys: DrinkKey[]) => writeKey('drinks', JSON.stringify(keys)),
    setReminders: (on: boolean) => writeKey('reminders', on ? 'on' : 'off'),
  };
}

// ---- Daily log -------------------------------------------------------------

export interface Entry {
  k: DrinkKey;
  ml: number;
  /** When it was logged (ms since epoch). Missing on entries from older builds. */
  t?: number;
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Local midnight of a `dayKey`. */
export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function loadToday(): Entry[] {
  try {
    const saved = JSON.parse(readKey('today') ?? 'null');
    if (saved && saved.day === dayKey(new Date()) && Array.isArray(saved.entries)) return saved.entries;
  } catch {
    // Corrupt data: start the day fresh.
  }
  return [];
}

/** Days of drink detail kept for the weekly read. */
const LOG_DAYS = 35;

/** Per-day drink entries, keyed by `dayKey`. */
export function loadLog(): Record<string, Entry[]> {
  try {
    const log = JSON.parse(readKey('log') ?? '{}');
    return log && typeof log === 'object' ? log : {};
  } catch {
    return {};
  }
}

export function saveToday(entries: Entry[]) {
  const today = dayKey(new Date());
  writeKey('today', JSON.stringify({ day: today, entries }));
  const log = loadLog();
  log[today] = entries;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOG_DAYS);
  for (const key of Object.keys(log)) {
    if (parseDayKey(key) < cutoff) delete log[key];
  }
  writeKey('log', JSON.stringify(log));
  try {
    const hist = JSON.parse(readKey('history') ?? '{}');
    // What counts toward the goal (alcohol doesn't), so streaks match Home.
    hist[today] = entries.reduce((t, e) => t + hydrationMl(e), 0);
    writeKey('history', JSON.stringify(hist));
  } catch {
    // History is best-effort; only the streak depends on it.
  }
}

/**
 * One-time cleanup: early builds logged the onboarding practice pour as today's
 * first drink. Drop that entry (water, same amount as the saved first sip) once.
 */
export function migrateStorage() {
  if (readKey('migrated.firstSip')) return;
  const firstSip = Number(readKey('firstSip'));
  const entries = loadToday();
  if (firstSip && entries[0]?.k === 'water' && entries[0].ml === firstSip) saveToday(entries.slice(1));
  writeKey('migrated.firstSip', '1');
}

/** Consecutive days (ending today) that hit the goal. Today counts only once it is met. */
export function streakDays(todayTotal: number, goal: number) {
  let hist: Record<string, number> = {};
  try {
    hist = JSON.parse(readKey('history') ?? '{}');
  } catch {
    // Treat as no history.
  }
  const d = new Date();
  let n = todayTotal >= goal ? 1 : 0;
  for (let i = 1; i < 400; i++) {
    d.setDate(d.getDate() - 1);
    if ((hist[dayKey(d)] || 0) >= goal) n++;
    else break;
  }
  return n;
}
