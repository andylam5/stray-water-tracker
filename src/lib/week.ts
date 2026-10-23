import { drinkFor, hydrationMl, type DrinkKey } from './drinks';
import { dayKey, loadLog, loadToday, parseDayKey, readKey, type Entry } from './storage';
import type { DayDrink, DaySummary } from './weeklyReadTypes';

const NAMES: DaySummary['name'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const clock = (t: number) =>
  new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

const toDrink = (k: string, ml: number, time?: string): DayDrink => ({
  k,
  name: drinkFor(k).name,
  ml: Math.round(ml),
  counted: Math.round(hydrationMl({ k, ml })),
  ...(time ? { time } : {}),
});

const toDrinks = (entries: Entry[]): DayDrink[] => entries.map((e) => toDrink(e.k, e.ml, e.t ? clock(e.t) : undefined));

/** Midnight of the first day anything was logged, or null if nothing ever was. */
function trackingStart(log: Record<string, Entry[]>): Date | null {
  let history: Record<string, number> = {};
  try {
    history = JSON.parse(readKey('history') ?? '{}');
  } catch {
    // The log alone is enough.
  }
  // History outlives the 35-day log, so it finds the start for long-time users.
  const keys = [...Object.keys(log).filter((k) => log[k]?.length), ...Object.keys(history).filter((k) => history[k] > 0)];
  const starts = keys.map((k) => parseDayKey(k).getTime()).filter((t) => !Number.isNaN(t));
  return starts.length ? new Date(Math.min(...starts)) : null;
}

/**
 * The last 7 days ending today, oldest first, or null if nothing was logged in them.
 * Days before the first-ever log are marked untracked, so a new user's empty days
 * aren't read as days they drank nothing.
 */
export function lastSevenDays(): DaySummary[] | null {
  const log = loadLog();
  const todayKey = dayKey(new Date());
  // Today may predate the per-day log, so read it from its own key.
  log[todayKey] = loadToday();
  const start = trackingStart(log);
  const days: DaySummary[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const name = NAMES[d.getDay()];
    const tracked = !!start && d >= start;
    days.push({ label: name[0], name, dow: d.getDay(), tracked, drinks: toDrinks(log[dayKey(d)] ?? []) });
    d.setDate(d.getDate() + 1);
  }
  return days.some((day) => day.drinks.length > 0) ? days : null;
}

type ExampleDrink = [DrinkKey, number, string];

const example = (name: DaySummary['name'], drinks: ExampleDrink[]): DaySummary => ({
  label: name[0],
  name,
  dow: NAMES.indexOf(name),
  tracked: true,
  drinks: drinks.map(([k, ml, time]) => toDrink(k, ml, time)),
});

/** Illustrative week shown before the user has logged anything. */
export const EXAMPLE_WEEK: DaySummary[] = [
  example('Monday', [['coffee', 300, '7:50 am'], ['water', 600, '11:30 am'], ['tea', 400, '3:15 pm'], ['water', 600, '7:00 pm']]),
  example('Tuesday', [['water', 500, '8:10 am'], ['coffee', 200, '9:00 am'], ['water', 700, '1:00 pm'], ['juice', 200, '4:30 pm'], ['tea', 300, '6:20 pm'], ['water', 600, '8:45 pm']]),
  example('Wednesday', [['coffee', 300, '8:30 am'], ['juice', 300, '12:40 pm'], ['coffee', 300, '2:10 pm'], ['tea', 200, '5:00 pm'], ['water', 700, '9:30 pm']]),
  example('Thursday', [['water', 600, '7:40 am'], ['milk', 270, '8:15 am'], ['water', 700, '12:00 pm'], ['sparkling', 330, '3:30 pm'], ['tea', 300, '5:45 pm'], ['water', 700, '8:00 pm']]),
  example('Friday', [['water', 500, '9:20 am'], ['coffee', 300, '10:00 am'], ['sparkling', 330, '1:30 pm'], ['water', 1000, '4:00 pm'], ['tea', 400, '7:30 pm']]),
  example('Saturday', [['coffee', 200, '10:30 am'], ['juice', 400, '12:15 pm'], ['water', 1300, '6:00 pm']]),
  example('Sunday', [['water', 800, '9:00 am'], ['coffee', 300, '10:15 am'], ['tea', 500, '2:30 pm'], ['water', 800, '6:40 pm']]),
];

/** What counted toward the goal that day, ml. */
export const dayTotal = (day: DaySummary) => day.drinks.reduce((s, x) => s + x.counted, 0);
