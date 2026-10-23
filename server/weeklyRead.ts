import type { DaySummary, WeeklyRead, WeeklyReadError, WeeklyReadRequest } from '../src/lib/weeklyReadTypes.ts';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const ML_PER_OZ = 29.5735;
const TIMEOUT_MS = 20_000;
/** Gemini's overload errors are usually gone a moment later. */
const RETRY_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAY_MS = 800;
/** Bubbles are small; Gemini doesn't enforce string lengths, so cap them here. */
const MAX_CHARS = 160;

const SYSTEM_INSTRUCTION = `You are Stray, a small black cat who lives inside a water-tracking app and reads the user's drink log.
Voice: dry, deadpan, a little smug, secretly caring. Short sentences. No emoji, no exclamation marks, no hashtags.
You sound like a cat with opinions, not a report. Tone example only, never reuse its content: "Five days out of six. I'm almost impressed. Almost."
State the fact, then let the attitude show in a short aside.
Rules:
- Only use facts present in the week summary and the log. Never invent drinks, times or numbers.
- Every amount, percentage, time and day you mention must match the week summary or the log exactly.
  Don't recompute, round or approximate them, and don't describe times loosely (no "midnight" for 9:30 pm).
- Say those facts in your own voice. Never copy the log's wording, labels or parentheses.
- No medical claims or diagnoses. Hydration habits only.
- Each comment is one observation about a pattern or notable moment, under 110 characters.
- The suggestion is one concrete, doable action for next time, under 120 characters.
- Address the user as "you".`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    comments: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
    suggestion: { type: 'string' },
  },
  required: ['comments', 'suggestion'],
};

export class WeeklyReadFailure extends Error {
  readonly status: number;
  readonly code: WeeklyReadError['code'];
  constructor(status: number, code: WeeklyReadError['code'], message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Minutes after midnight for a logged time like "9:40 am", or null. */
function minutesOf(time: string | undefined) {
  const m = time?.match(/^(\d{1,2}):(\d{2})\s*([ap])m$/i);
  if (!m) return null;
  return ((Number(m[1]) % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0)) * 60 + Number(m[2]);
}

const clockOf = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  return `${h % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

const dayTotal = (d: DaySummary) => d.drinks.reduce((s, x) => s + x.counted, 0);
const percent = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

/**
 * Exact weekly figures. A small model asked for "patterns" tends to fixate on the most
 * dramatic day and fumble the arithmetic, so the server does the math and the model
 * quotes it.
 */
function weekSummary(req: WeeklyReadRequest, amount: (ml: number) => string) {
  // A real log ends today, which isn't over yet, so it doesn't count as a hit or miss.
  const todayIndex = req.example ? -1 : req.week.length - 1;
  const finished = req.week.filter((d, i) => d.tracked && i !== todayIndex);
  const lines: string[] = [];

  if (finished.length) {
    const totals = finished.map((d) => ({ name: d.name, ml: dayTotal(d) }));
    const hits = totals.filter((t) => t.ml >= req.goalMl).length;
    const average = totals.reduce((s, t) => s + t.ml, 0) / totals.length;
    lines.push(`Goal hit on ${hits} of ${finished.length} finished days.`);
    lines.push(`Average per finished day: ${amount(average)} toward the goal (${percent(average, req.goalMl)} of the goal).`);
    if (totals.length > 1) {
      const sorted = [...totals].sort((a, b) => b.ml - a.ml);
      const [best, lowest] = [sorted[0], sorted.at(-1)!];
      lines.push(`Best day: ${best.name} (${amount(best.ml)}). Lowest day: ${lowest.name} (${amount(lowest.ml)}).`);
    }
  }
  const today = req.week[todayIndex];
  if (today?.tracked) lines.push(`Today (${today.name}) is still in progress: ${amount(dayTotal(today))} so far.`);

  // Habits come from finished days; today's half-day would skew timing. A brand-new user only has today.
  const days = (finished.length ? finished : req.week.filter((d) => d.tracked)).filter((d) => d.drinks.length);
  const drinks = days.flatMap((d) => d.drinks);
  // Mix and timing from a single day (often a single drink) read as nonsense like "100% in the afternoon".
  if (days.length < 2) return lines;
  const counted = drinks.reduce((s, x) => s + x.counted, 0);
  if (counted > 0) {
    const byDrink = new Map<string, number>();
    for (const x of drinks) byDrink.set(x.name.toLowerCase(), (byDrink.get(x.name.toLowerCase()) ?? 0) + x.counted);
    const mix = [...byDrink].filter(([, ml]) => ml > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
    lines.push(`Where the counted volume came from: ${mix.map(([name, ml]) => `${name} ${percent(ml, counted)}`).join(', ')}.`);
  }
  const uncounted = drinks.filter((x) => x.counted === 0 && x.ml > 0).length;
  if (uncounted) lines.push(`Alcoholic drinks, which count nothing: ${uncounted}.`);

  const timed = drinks.flatMap((x) => {
    const minutes = minutesOf(x.time);
    return minutes === null ? [] : [{ minutes, counted: x.counted }];
  });
  const timedTotal = timed.reduce((s, x) => s + x.counted, 0);
  if (timedTotal > 0) {
    const part = (from: number, to: number) => timed.filter((x) => x.minutes >= from && x.minutes < to).reduce((s, x) => s + x.counted, 0);
    lines.push(
      `When it was drunk: morning (before 12 pm) ${percent(part(0, 720), timedTotal)}, afternoon (12 to 6 pm) ${percent(part(720, 1080), timedTotal)}, evening (after 6 pm) ${percent(part(1080, 1440), timedTotal)}.`,
    );
    const firsts = days.map((d) => minutesOf(d.drinks[0]?.time)).filter((m): m is number => m !== null).sort((a, b) => a - b);
    if (firsts.length) lines.push(`First drink of the day: between ${clockOf(firsts[0])} and ${clockOf(firsts.at(-1)!)}.`);
  }
  return lines;
}

function describeWeek(req: WeeklyReadRequest) {
  const tracked = req.week.filter((d) => d.tracked).length;
  const amount = (ml: number) =>
    req.unit === 'oz' ? `${Math.round(ml / ML_PER_OZ)} oz` : `${Math.round(ml / 10) * 10} ml`;
  const day = (d: DaySummary, i: number) => {
    if (!d.tracked) return `${d.name}: before the user started using the app.`;
    const today = !req.example && i === req.week.length - 1;
    const total = dayTotal(d);
    const drinks = d.drinks.length
      ? d.drinks
          .map((x) => `${x.time ? `${x.time} ` : ''}${x.name.toLowerCase()} ${amount(x.ml)}${x.counted < x.ml ? ` (counts ${amount(x.counted)})` : ''}`)
          .join(', ')
      : 'nothing logged';
    const status = total >= req.goalMl ? 'goal hit' : today ? 'today, still in progress' : 'goal missed';
    return `${d.name}: ${amount(total)} toward the goal (${status}). ${drinks}`;
  };
  return [
    `Daily goal: ${amount(req.goalMl)}. Unit: ${req.unit}. Drinks count toward the goal at less than their full volume when noted; alcohol counts nothing.`,
    req.example ? 'This is an example week shown during onboarding.' : "This is the user's last 7 days, ending today.",
    ...(tracked < 7
      ? [`${tracked === 1 ? 'The user only started tracking today' : `The user has only been tracking for the last ${tracked} days`}. Days marked "before the user started" are not missed days: never mention them, and judge only the tracked days.`]
      : []),
    '',
    'Week summary (exact figures: use these numbers, never recompute them):',
    ...weekSummary(req, amount).map((line) => `- ${line}`),
    '',
    'Day by day:',
    ...req.week.map(day),
  ].join('\n');
}

function buildPrompt(req: WeeklyReadRequest) {
  const log = `${describeWeek(req)}\n\nWrite everything in ${req.language}.`;
  const tracked = req.week.filter((d) => d.tracked).length;
  if (req.focus === null) {
    if (tracked === 1) {
      return `${log}\n\nOnly today is tracked so far. Write two comments about today so far, then one suggestion for the rest of today.`;
    }
    const span = tracked === 7 ? 'the week' : 'the days tracked so far';
    return `${log}\n\nWrite the weekly read about ${span} as a whole, not any one day. Build both comments from the week summary: how often the goal was hit, the daily average, the drink mix, when in the day the user drinks, the best and lowest day. Each comment must describe something across several days. Never make a comment about a single day's drinks. Then one suggestion for the coming week that tackles the biggest weekly pattern.`;
  }
  const name = req.week[req.focus].name;
  return `${log}\n\nWrite a read for ${name} only: two comments about what happened on ${name}. Look closely at that day's times and amounts in the day-by-day log: when the user drank, big catch-ups, long gaps, what didn't count. You may compare it to the week summary. Then one suggestion tailored to that day.`;
}

function clamp(text: string) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= MAX_CHARS) return t;
  const cut = t.slice(0, MAX_CHARS - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

/** Calls Gemini and returns exactly two comments and one suggestion. */
export async function generateWeeklyRead(req: WeeklyReadRequest, apiKey: string, model = DEFAULT_MODEL): Promise<WeeklyRead> {
  const body = JSON.stringify({
    model,
    system_instruction: SYSTEM_INSTRUCTION,
    input: buildPrompt(req),
    generation_config: { thinking_level: 'minimal' },
    response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
  });
  const deadline = AbortSignal.timeout(TIMEOUT_MS);
  const call = () =>
    fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, signal: deadline, body });
  let res = await call();
  if (RETRY_STATUSES.has(res.status)) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    res = await call();
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new WeeklyReadFailure(502, 'upstream', `Gemini returned ${res.status}: ${detail.slice(0, 300)}`);
  }
  type Step = { type?: string; content?: { type?: string; text?: string }[] };
  const result = (await res.json()) as { steps?: Step[] };
  // Thinking can add steps before the answer, so find the model output instead of using steps[0].
  const output = result.steps?.find((s) => s.type === 'model_output');
  const text = output?.content?.find((c) => c.type === 'text')?.text;
  let parsed: { comments?: unknown; suggestion?: unknown };
  try {
    parsed = JSON.parse(text ?? '');
  } catch {
    throw new WeeklyReadFailure(502, 'upstream', 'Gemini did not return JSON');
  }
  const { comments, suggestion } = parsed;
  if (!Array.isArray(comments) || comments.length < 2 || !comments.every((c) => typeof c === 'string') || typeof suggestion !== 'string') {
    throw new WeeklyReadFailure(502, 'upstream', 'Gemini returned an unexpected shape');
  }
  return { comments: [clamp(comments[0]), clamp(comments[1])], suggestion: clamp(suggestion) };
}
