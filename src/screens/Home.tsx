import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DrinkPicker } from '../components/DrinkPicker';
import { BeveragesSheet } from '../components/BeveragesSheet';
import { DrinkSheet } from '../components/DrinkSheet';
import { WavesIcon } from '../components/Icons';
import { LanguageSheet } from '../components/LanguageSheet';
import { LiquidBands, Surface } from '../components/LiquidBands';
import { SettingsSheet } from '../components/SettingsSheet';
import { StreakRing } from '../components/StreakRing';
import { shortMonth, useT } from '../i18n';
import { rippleBands } from '../lib/bands';
import { drinkFor, hydrationMl, type DrinkKey } from '../lib/drinks';
import { loadToday, saveToday, streakDays, usePrefs, type Entry } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import strayImg from '../assets/stray.png';

const STAGE_W = 286;
const STAGE_H = 318;
/** Stray is "full" at 90% of the silhouette height, leaving the ears empty. */
const FULL = 0.9;

/** Stray's reaction is the line for the first threshold (% of goal) not yet reached; past the last, the final line. */
const LINE_AT = [25, 50, 75, 100, 110, 130, 150];

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d;
}

export default function Home() {
  const { units, goal, enabledDrinks, language } = usePrefs();
  const t = useT();
  const [entries, setEntries] = useState<Entry[]>(loadToday);
  /** While undoing, the old stack stays drawn so the removed layer drains away. */
  const [ghost, setGhost] = useState<Entry[] | null>(null);
  const [sheet, setSheet] = useState<DrinkKey | null>(null);
  const [panel, setPanel] = useState<'settings' | 'beverages' | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const drainTimer = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      clearTimeout(drainTimer.current);
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const update = (next: Entry[]) => {
    saveToday(next);
    setEntries(next);
  };

  const add = (k: DrinkKey, ml: number) => {
    setSheet(null);
    // Let the sheet slide away before the cat fills.
    later(() => {
      clearTimeout(drainTimer.current);
      setGhost(null);
      setEntries((prev) => {
        const next = [...prev, { k, ml, t: Date.now() }];
        saveToday(next);
        return next;
      });
    }, 280);
  };

  const undo = () => {
    // Keep the stack from before the first undo drawn for the whole burst, so rapid
    // undos drain smoothly instead of re-laying out the layers on every tap.
    setGhost((g) => g ?? entries);
    update(entries.slice(0, -1));
    clearTimeout(drainTimer.current);
    drainTimer.current = window.setTimeout(() => setGhost(null), 950);
  };

  const clearToday = () => {
    setPanel(null);
    if (!entries.length) return;
    setGhost((g) => g ?? entries);
    update([]);
    clearTimeout(drainTimer.current);
    drainTimer.current = window.setTimeout(() => setGhost(null), 950);
  };

  const closeSheet = useCallback(() => setSheet(null), []);

  // Only what counts toward the goal fills Stray (alcohol counts 0).
  const total = entries.reduce((s, e) => s + hydrationMl(e), 0);
  const pct = Math.round((total / goal) * 100);
  const goalMet = total >= goal;
  const drawn = ghost && ghost.length > entries.length ? ghost : entries;
  const drawnTotal = drawn.reduce((s, e) => s + hydrationMl(e), 0);
  const scale = (FULL * STAGE_H) / Math.max(goal, drawnTotal);
  const surfacePx = Math.min(total * scale, FULL * STAGE_H);
  const hiddenPx = STAGE_H - surfacePx;
  /** Surface color comes from the last drink that actually added liquid. */
  const lastCounted = drinkFor([...entries].reverse().find((e) => hydrationMl(e) > 0)?.k ?? 'water');
  const lastLogged = drinkFor(entries.at(-1)?.k ?? 'water');
  const lineAt = LINE_AT.findIndex((n) => pct < n);
  const line = t.home.lines[lineAt === -1 ? LINE_AT.length : lineAt];
  const streak = streakDays(total, goal);
  const sunday = nextSunday();

  const subText = !goalMet
    ? t.home.progress(pct, units.fmt(goal))
    : total - goal < units.stepMl
      ? t.home.reached
      : t.home.reachedExtra(units.fmt(total - goal));

  return (
    <main className="screen">
      <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 0' }}>
        <StreakRing days={streak} />
        <button type="button" className="icon-btn tap" aria-label={t.settings.title} aria-haspopup="dialog" onClick={() => setPanel('settings')} style={{ width: 46, height: 46, background: 'var(--pink-soft)' }}>
          <WavesIcon />
        </button>
      </div>

      <span aria-live="polite" style={{ marginTop: 4, fontSize: 58, fontWeight: 800, lineHeight: 1, color: 'var(--blue)' }}>
        {units.show(total)} {units.unit}
      </span>
      <span style={{ marginTop: 4, fontSize: 17, fontWeight: 600, color: 'var(--muted)' }}>{subText}</span>

      <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H, marginTop: 26 }}>
        <div className="layer" style={{ opacity: goalMet ? 0 : 1, transition: goalMet ? 'opacity .5s ease .8s' : 'opacity .35s ease' }}>
          <div className="cat cat-empty" />
          <div className="cat layer" role="img" aria-label={t.home.fill(pct)} style={{ overflow: 'hidden' }}>
            {/*
              The window slides down to hide the empty part while its content slides up by
              the same amount, so the layers stay put and only the edge moves. Transforms keep
              this on the GPU and in step with the surface wave; animating height or clip-path
              janks in WebKit inside the cat mask.
            */}
            <div className="fill-window" style={{ transform: `translateY(${hiddenPx.toFixed(1)}px)` }}>
              <div className="fill-window" style={{ transform: `translateY(${(-hiddenPx).toFixed(1)}px)` }}>
                <LiquidBands bands={rippleBands(drawn.filter((e) => hydrationMl(e) > 0).map((e) => ({ c: drinkFor(e.k).c, px: hydrationMl(e) * scale })))} />
              </div>
            </div>
            <div className="surf" style={{ position: 'absolute', left: 0, width: '100%', bottom: -2, height: 20, opacity: total > 0 ? 1 : 0, transform: `translateY(${(-surfacePx).toFixed(1)}px)` }}>
              <Surface top={lastCounted.c} light={lastCounted.light} />
            </div>
          </div>
        </div>
        {goalMet && <img className="reveal layer" src={strayImg} alt={t.home.fullAlt} style={{ width: '100%', height: '100%', animationDelay: '.75s' }} />}
        <p key={line} className="speech pop" aria-live="polite" style={{ left: -34, top: 6, width: 132, borderRadius: '18px 18px 4px 18px', padding: '6px 10px', fontSize: 14, lineHeight: 1.3 }}>
          {line}
        </p>
      </div>

      <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'center', height: 36, marginTop: 4 }}>
        {entries.length > 0 && (
          <button type="button" onClick={undo} style={{ height: 36, padding: '0 12px', border: 0, background: 'transparent', fontSize: 15, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer' }}>
            {t.home.undo(t.drinks[lastLogged.key][0])}
          </button>
        )}
      </div>

      <DrinkPicker drinks={enabledDrinks} onPick={setSheet} onEdit={() => setPanel('beverages')} />

      <Link
        to={ROUTES.week}
        className="tap"
        style={{ margin: 'auto 16px 30px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 10px 10px', borderRadius: 26, border: '2.5px solid var(--ink)', background: 'var(--ink)', color: '#FFFFFF', boxShadow: '0 4px 0 var(--pink)', textDecoration: 'none' }}
      >
        <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 16, background: 'var(--sky)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={strayImg} alt="" style={{ width: 38, height: 42 }} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{t.weekly.name}</span>
          <span style={{ fontSize: 14, color: '#C9CEE6' }}>{t.weekly.homeSub}</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, color: 'var(--pink-soft)' }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>{sunday.getDate()}</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{shortMonth(sunday, language.id)}</span>
        </span>
      </Link>

      {sheet && <DrinkSheet key={sheet} drink={sheet} units={units} onClose={closeSheet} onConfirm={(ml) => add(sheet, ml)} />}
      {panel === 'settings' && (
        <SettingsSheet
          onClose={() => setPanel(null)}
          onOpenLanguage={() => setLangOpen(true)}
          onOpenBeverages={() => setPanel('beverages')}
          onClearToday={clearToday}
        />
      )}
      {panel === 'beverages' && <BeveragesSheet onClose={() => setPanel(null)} />}
      {langOpen && <LanguageSheet onClose={() => setLangOpen(false)} layer={1} />}
    </main>
  );
}
