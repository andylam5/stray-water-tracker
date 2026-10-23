// Shared by the app and the /api/weekly-read server handler. The server validates
// requests with these schemas; the app only imports the types, so zod stays out of
// the client bundle.
import { z } from 'zod';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const DayDrinkSchema = z.object({
  /** Drink id, like "greentea". */
  k: z.string().regex(/^[a-z]{1,20}$/),
  /** English display name, like "Green tea". */
  name: z.string().max(40),
  ml: z.number().min(0).max(10_000),
  /** How much counts toward the goal (alcohol counts 0), ml. */
  counted: z.number().min(0).max(10_000),
  /** Local time it was logged, like "9:40 am". Missing for older entries. */
  time: z.string().max(20).optional(),
});

export const DaySummarySchema = z.object({
  /** Single letter for the chart, like "W". */
  label: z.string().max(4),
  /** Full weekday in English, like "Wednesday". The prompt uses this. */
  name: z.enum(WEEKDAYS),
  /** Day of week, 0 = Sunday, for showing the name in the user's language. */
  dow: z.number().int().min(0).max(6),
  /** False for days before the user's first log: not "nothing drunk", just not using the app yet. */
  tracked: z.boolean(),
  drinks: z.array(DayDrinkSchema).max(100),
});

export const WeeklyReadRequestSchema = z.object({
  unit: z.enum(['ml', 'oz']),
  goalMl: z.number().positive().max(20_000),
  /** Seven days, oldest first. */
  week: z.array(DaySummarySchema).length(7),
  /** Index into `week` for a single-day read, or null for the whole week. */
  focus: z.number().int().min(0).max(6).nullable(),
  /** True when `week` is the onboarding example rather than the user's log. */
  example: z.boolean(),
  /** Language to write in, in English (e.g. "Japanese"). */
  language: z.string().regex(/^[A-Za-z ]{2,30}$/),
})
  .refine((r) => r.week.some((d) => d.tracked), 'At least one day must be tracked')
  .refine((r) => r.focus === null || r.week[r.focus].tracked, 'The focused day must be tracked');

export type DayDrink = z.infer<typeof DayDrinkSchema>;
export type DaySummary = z.infer<typeof DaySummarySchema>;
export type WeeklyReadRequest = z.infer<typeof WeeklyReadRequestSchema>;

export interface WeeklyRead {
  comments: [string, string];
  suggestion: string;
}

export type WeeklyReadError = {
  error: string;
  code: 'not_configured' | 'bad_request' | 'rate_limited' | 'upstream';
};
