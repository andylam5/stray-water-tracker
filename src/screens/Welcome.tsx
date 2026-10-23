import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlobeIcon } from '../components/Icons';
import { LanguageSheet } from '../components/LanguageSheet';
import { LiquidBands, Surface } from '../components/LiquidBands';
import { prefersReducedMotion, rippleBands } from '../lib/bands';
import { DRINKS, type DrinkKey } from '../lib/drinks';
import { useT } from '../i18n';
import { shortLabel } from '../lib/i18n';
import { ROUTES } from '../lib/routes';
import { usePrefs } from '../lib/storage';
import strayImg from '../assets/stray.png';

const INTRO_DRINKS: DrinkKey[] = ['juice', 'coffee', 'tea', 'milk', 'sparkling', 'water'];
const STEP_MS = 700;
const START_DELAY_MS = 350;
const STAGE_H = 334;

/** The design's 44px title fits short Latin text; longer or wider scripts step down so Stray keeps its space. */
const titleSize = (title: string) => (/[^ -\u024F’]/.test(title) ? 36 : title.length > 20 ? 34 : title.length > 16 ? 38 : 44);

/** Four random drinks, never the same set twice in a row. */
function pickFour(prev: number[]) {
  const prevKey = [...prev].sort().join(',');
  let picks: number[];
  do {
    const pool = INTRO_DRINKS.map((_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    picks = pool.slice(0, 4);
  } while ([...picks].sort().join(',') === prevKey);
  return picks;
}

export default function Welcome() {
  const { language } = usePrefs();
  const t = useT().welcome;
  const [langOpen, setLangOpen] = useState(false);
  const [picks, setPicks] = useState<number[]>([0, 1, 2, 5]);
  const [level, setLevel] = useState(0);
  const [done, setDone] = useState(false);
  const picksRef = useRef(picks);
  const raf = useRef(0);
  const timer = useRef(0);

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    clearTimeout(timer.current);
    const next = pickFour(picksRef.current);
    picksRef.current = next;
    setPicks(next);
    if (prefersReducedMotion()) {
      setLevel(100);
      setDone(true);
      return;
    }
    setLevel(0);
    setDone(false);
    const total = STEP_MS * next.length;
    const start = performance.now();
    const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start - START_DELAY_MS) / total));
      setLevel(ease(t) * 100);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else timer.current = window.setTimeout(() => setDone(true), 200);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    play();
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
    };
  }, [play]);

  const list = picks.map((i) => DRINKS[INTRO_DRINKS[i]]);
  const share = 100 / list.length;
  const current = list[Math.min(list.length - 1, Math.floor(level / share))];
  const bands = rippleBands(list.map((d) => ({ c: d.c, px: STAGE_H / list.length })));

  return (
    <main className="screen">
      <svg aria-hidden="true" width="44" height="52" viewBox="0 0 44 52" style={{ marginTop: 92 }}>
        <path d="M6 12h32l-4 34a5 5 0 0 1-5 4H15a5 5 0 0 1-5-4z" fill="#4FA3F7" stroke="#1E2340" strokeWidth={3} strokeLinejoin="round" />
        <path d="M6 12h32" stroke="#1E2340" strokeWidth={3} strokeLinecap="round" />
        <path d="M26 12l6-10" stroke="#1E2340" strokeWidth={3} strokeLinecap="round" />
      </svg>
      <h1 className="title" style={{ marginTop: 10, marginInline: 20, fontSize: titleSize(t.title) }}>{t.title}</h1>
      <p className="lede" style={{ marginTop: 10, fontSize: 18 }}>{t.sub}</p>

      <button
        type="button"
        onClick={play}
        aria-label={t.replay}
        className="cat-stage"
        style={{ marginTop: 40, padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
      >
        <div className="layer fade" style={{ opacity: done ? 0 : 1 }}>
          <div className="cat cat-empty" />
          <div className="cat layer" style={{ overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${level.toFixed(2)}%`, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: STAGE_H }}>
                <LiquidBands bands={bands} />
              </div>
            </div>
            {level > 0.5 && (
              <div style={{ position: 'absolute', left: 0, width: '100%', bottom: `${level.toFixed(2)}%`, height: 18, marginBottom: -2 }}>
                <Surface top={current.c} light={current.light} frontStyle={{ bottom: 0 }} />
              </div>
            )}
          </div>
        </div>
        {done && <img className="reveal layer" src={strayImg} alt="" style={{ width: '100%', height: '100%' }} />}
      </button>

      <div style={{ marginTop: 'auto', alignSelf: 'stretch', padding: '0 24px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="tap"
          aria-label={t.language(language.native)}
          aria-haspopup="dialog"
          onClick={() => setLangOpen(true)}
          style={{ height: 58, padding: '0 14px', borderRadius: 18, border: '2.5px solid var(--ink)', background: '#FFFFFF', boxShadow: '0 3px 0 var(--ink)', fontSize: 17, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <GlobeIcon />
          {shortLabel(language)}
        </button>
        <Link to={ROUTES.units} className="btn btn-primary tap" style={{ flexGrow: 1, height: 58 }}>
          {t.start}
        </Link>
      </div>
      <Link to={ROUTES.home} style={{ marginBottom: 28, fontSize: 16, fontWeight: 600, padding: '8px 12px' }}>
        {t.account}
      </Link>
      {langOpen && <LanguageSheet onClose={() => setLangOpen(false)} />}
    </main>
  );
}
