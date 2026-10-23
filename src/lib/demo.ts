import { DRINKS, hydrationMl, type DrinkKey } from './drinks';
import { clearStorage, dayKey, loadLog, readKey, writeKey, type Entry } from './storage';

/**
 * Demo tools: fill the past six days with a believable week so the streak, chart and
 * weekly read can be shown without waiting a week. The data goes into the real log,
 * so everything downstream (including the AI read) runs the real code path.
 *
 * Always on in development. In a production build, open the app with `?demo` to turn
 * them on for this browser, and `?demo=off` to hide them again.
 */

/** Remembers the ?demo URL flag, which is lost as soon as the app navigates. */
export function readDemoFlag() {
  const flag = new URLSearchParams(window.location.search).get('demo');
  if (flag !== null) writeKey('demo', flag === 'off' ? 'off' : 'on');
}

export const demoEnabled = () => import.meta.env.DEV || readKey('demo') === 'on';

/** [hour, minute, drink, share of the day's goal-counted total]. Alcohol ignores its share and pours its default. */
type Sip = [number, number, DrinkKey, number];

// Oldest first, ending yesterday. Factors are each day's total as a share of the goal:
// one miss (an evening catch-up day), then four hits in a row, so the streak shows 4.
const DAYS: { factor: number; sips: Sip[] }[] = [
  { factor: 1.1, sips: [[8, 10, 'coffee', 0.12], [10, 30, 'water', 0.25], [13, 0, 'water', 0.25], [16, 15, 'tea', 0.13], [19, 30, 'water', 0.25]] },
  { factor: 0.8, sips: [[9, 0, 'coffee', 0.12], [12, 40, 'juice', 0.1], [15, 0, 'coffee', 0.12], [20, 15, 'beer', 0], [21, 30, 'water', 0.66]] },
  { factor: 1.05, sips: [[7, 40, 'water', 0.25], [8, 15, 'milk', 0.1], [12, 0, 'water', 0.25], [15, 30, 'sparkling', 0.15], [18, 45, 'tea', 0.1], [20, 0, 'water', 0.15]] },
  { factor: 1.15, sips: [[8, 30, 'coffee', 0.12], [11, 0, 'water', 0.3], [14, 0, 'greentea', 0.13], [17, 30, 'water', 0.3], [20, 0, 'herbal', 0.15]] },
  { factor: 1.02, sips: [[10, 0, 'coffee', 0.12], [12, 30, 'smoothie', 0.15], [16, 0, 'water', 0.4], [21, 0, 'water', 0.33]] },
  { factor: 1.1, sips: [[8, 0, 'water', 0.2], [9, 15, 'latte', 0.15], [13, 0, 'water', 0.3], [17, 0, 'icedtea', 0.15], [21, 0, 'water', 0.2]] },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(readKey(key) ?? '') ?? fallback;
  } catch {
    return fallback;
  }
}

export const hasDemoWeek = () => readJson<string[]>('demoDays', []).length > 0;

/** Writes the demo days into the log and history, replacing whatever those six days held. Today is left alone. */
export function loadDemoWeek(goalMl: number) {
  const log = loadLog();
  const history = readJson<Record<string, number>>('history', {});
  const keys: string[] = [];
  DAYS.forEach(({ factor, sips }, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (DAYS.length - i));
    const entries: Entry[] = sips.map(([h, m, k, share]) => {
      const d = DRINKS[k];
      const ml = d.hydration ? (share * factor * goalMl) / d.hydration : d.ml;
      return { k, ml: Math.round(ml / 10) * 10, t: new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime() };
    });
    const key = dayKey(day);
    log[key] = entries;
    history[key] = entries.reduce((s, e) => s + hydrationMl(e), 0);
    keys.push(key);
  });
  writeKey('log', JSON.stringify(log));
  writeKey('history', JSON.stringify(history));
  writeKey('demoDays', JSON.stringify(keys));
}

/** Removes the days `loadDemoWeek` wrote. */
export function removeDemoWeek() {
  const log = loadLog();
  const history = readJson<Record<string, number>>('history', {});
  for (const key of readJson<string[]>('demoDays', [])) {
    delete log[key];
    delete history[key];
  }
  writeKey('log', JSON.stringify(log));
  writeKey('history', JSON.stringify(history));
  writeKey('demoDays', '[]');
}

/** Back to a brand-new user: drinks, goal, units, language and onboarding all forgotten. Keeps the demo tools on. */
export const resetAllData = () => clearStorage(['demo']);
