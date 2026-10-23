import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BackIcon } from '../components/Icons';
import { StrayAvatar } from '../components/StrayAvatar';
import { useWeeklyRead } from '../hooks/useWeeklyRead';
import { clockTime, useT, weekdayName, type Messages } from '../i18n';
import { drinkFor } from '../lib/drinks';
import { readKey, usePrefs, writeKey } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import { dayTotal, EXAMPLE_WEEK, lastSevenDays } from '../lib/week';
import type { DaySummary } from '../lib/weeklyReadTypes';
import type { LangId } from '../lib/i18n';
import type { UnitHelpers } from '../lib/units';

const CHART_H = 100;
/** Day label (13px × line height) plus the gap above it. */
const LABEL_H = 25;
const BAR_BORDER = 4;
const MAX_BAR = CHART_H - LABEL_H - BAR_BORDER - 8;

/**
 * Stray's read of the last 7 days. Onboarding shows it as a pitch with Skip; from Home
 * (`fromHome`) it's the user's own week, and Back returns to Home.
 */
export default function WeeklyRead({ fromHome = false }: { fromHome?: boolean }) {
  const { units, goal, language } = usePrefs();
  const t = useT();
  const w = t.weekly;
  const [enabled, setEnabled] = useState(() => readKey('weeklyRead') !== 'off');
  const [focus, setFocus] = useState<number | null>(null);
  // Real log if there is one, otherwise the onboarding example. Read once per visit.
  const [{ week, example }] = useState(() => {
    const real = lastSevenDays();
    return real ? { week: real, example: false } : { week: EXAMPLE_WEEK, example: true };
  });

  const request = useMemo(
    () => ({ unit: units.unit, goalMl: goal, week, focus, example, language: language.english }),
    [units.unit, goal, week, focus, example, language.english],
  );
  const { state, retry } = useWeeklyRead(request);

  const toggle = (on: boolean) => {
    setEnabled(on);
    writeKey('weeklyRead', on ? 'on' : 'off');
  };

  const tracked = week.filter((d) => d.tracked);
  const hits = tracked.filter((d) => dayTotal(d) >= goal).length;
  const focused = focus === null ? null : week[focus];
  const focusedName = focused ? weekdayName(focused.dow, language.id) : '';

  return (
    <main className="screen" style={{ alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '48px 24px 0' }}>
        <Link to={fromHome ? ROUTES.home : ROUTES.reminders} aria-label={t.common.back} className="icon-btn tap" style={{ borderRadius: 14 }}>
          <BackIcon />
        </Link>
        <span style={{ flexGrow: 1 }} />
        {!fromHome && <Link to={ROUTES.home} className="text-link">{t.common.skip}</Link>}
      </div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', padding: '4px 24px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* Auto margins center the content but still let it scroll if it ever overflows. */}
        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.05 }}>{fromHome ? w.name : w.title}</h1>
          {!fromHome && (
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.35, color: 'var(--muted)' }}>
              {w.lede}
            </p>
          )}

          <section aria-label={w.name} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', borderRadius: 24, border: '2.5px solid var(--ink)', background: '#FFFFFF', boxShadow: '0 4px 0 var(--ink)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>
                {focused ? `${focusedName} · ${units.fmt(dayTotal(focused))}` : example ? w.example : w.yours}
              </span>
              {focused ? (
                <button type="button" onClick={() => setFocus(null)} className="week-reset">
                  {w.wholeWeek}
                </button>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#FCE3EA', color: '#8A2E48' }}>
                  {w.goalHit(hits, tracked.length)}
                </span>
              )}
            </div>

            <WeekChart week={week} focus={focus} units={units} goal={goal} lang={language.id} t={w} onPick={(i) => setFocus(i === focus ? null : i)} />
            {focus === null && <span className="hint" style={{ fontSize: 13, marginTop: -4 }}>{w.tapHint}</span>}

            <div key={focus ?? 'week'} aria-live="polite" aria-busy={state.status === 'loading'} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
              {state.status === 'loading' && (
                <>
                  <SkeletonNote />
                  <SkeletonNote />
                  <SkeletonNote />
                  <span className="sr-only">{focused ? w.readingDay(focusedName) : w.readingWeek}</span>
                </>
              )}
              {state.status === 'ready' && (
                <>
                  <StrayNote delay="0s">{state.read.comments[0]}</StrayNote>
                  <StrayNote delay=".15s">{state.read.comments[1]}</StrayNote>
                  <StrayNote delay=".3s" suggestion>
                    <strong style={{ color: 'var(--blue)' }}>{w.tryThis}</strong>
                    {state.read.suggestion}
                  </StrayNote>
                </>
              )}
              {state.status === 'error' && (
                <StrayNote delay="0s">
                  {state.code === 'not_configured' ? w.notConfigured : state.code === 'rate_limited' ? w.busy : w.failed}{' '}
                  {state.code !== 'not_configured' && (
                    <button type="button" onClick={retry} className="inline-link">
                      {w.retry}
                    </button>
                  )}
                </StrayNote>
              )}
            </div>
          </section>

          <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', borderRadius: 20, border: '2.5px solid var(--ink)', background: '#FFFFFF', cursor: 'pointer' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} style={{ width: 26, height: 26, accentColor: 'var(--blue)', flexShrink: 0, margin: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{w.send}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.3 }}>{w.sendSub(clockTime(9, 0, language.id))}</span>
            </span>
          </label>
        </div>
      </div>

      <Link to={ROUTES.home} className="btn btn-primary tap" style={{ margin: '0 24px 36px' }}>
        {fromHome ? t.common.done : w.cta}
      </Link>
    </main>
  );
}

interface WeekChartProps {
  week: DaySummary[];
  focus: number | null;
  units: UnitHelpers;
  goal: number;
  lang: LangId;
  t: Messages['weekly'];
  onPick: (i: number) => void;
}

/** Stacked bar per day, split by drink. Each bar is a button that focuses that day; days before the user started are faded and inert. */
function WeekChart({ week, focus, units, goal, lang, t, onPick }: WeekChartProps) {
  const pxPerMl = MAX_BAR / Math.max(goal, ...week.map(dayTotal));
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, height: CHART_H }}>
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: LABEL_H + BAR_BORDER + goal * pxPerMl, borderTop: '2px dashed #9AA1BD' }} />
      {week.map((day, i) => {
        const selected = focus === i;
        const total = dayTotal(day);
        const name = weekdayName(day.dow, lang);
        return (
          <button
            key={i}
            type="button"
            className="day-bar"
            disabled={!day.tracked}
            aria-pressed={selected}
            aria-label={day.tracked ? t.barLabel(name, units.fmt(total)) : t.notTracked(name)}
            onClick={() => onPick(i)}
            style={{ opacity: !day.tracked ? 0.4 : focus === null || selected ? 1 : 0.35, cursor: day.tracked ? undefined : 'default' }}
          >
            <span className="grow" style={{ width: '100%', maxWidth: 30, display: 'flex', flexDirection: 'column-reverse', border: `2px ${day.tracked ? 'solid' : 'dashed'} ${selected ? 'var(--blue)' : day.tracked ? 'var(--ink)' : '#9AA1BD'}`, borderRadius: 8, overflow: 'hidden', animationDelay: `${(i * 0.06).toFixed(2)}s` }}>
              {day.drinks.map((d, j) => (
                <span key={j} style={{ display: 'block', height: `${(d.counted * pxPerMl).toFixed(1)}px`, background: drinkFor(d.k).c }} />
              ))}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: selected ? 'var(--blue)' : 'var(--muted)' }}>{weekdayName(day.dow, lang, 'narrow')}</span>
          </button>
        );
      })}
    </div>
  );
}

function StrayNote({ delay, suggestion, children }: { delay: string; suggestion?: boolean; children: ReactNode }) {
  return (
    <div className="pop" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', animationDelay: delay }}>
      <StrayAvatar />
      <p style={{ margin: 0, padding: '6px 11px', borderRadius: '4px 16px 16px 16px', background: suggestion ? 'var(--sky)' : 'var(--bubble)', fontSize: 14, lineHeight: 1.35 }}>{children}</p>
    </div>
  );
}

function SkeletonNote() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <StrayAvatar dimmed />
      <div className="skeleton" style={{ flexGrow: 1, height: 40, borderRadius: '4px 16px 16px 16px' }} />
    </div>
  );
}
