import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wave } from '../components/Wave';
import { clockTime, useT } from '../i18n';
import { usePrefs } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import strayImg from '../assets/stray.png';

const ROTATE_MS = 3200;
/** When each sample reminder arrives, [hour, minute]. */
const TIMES: [number, number][] = [[11, 20], [15, 5], [19, 40]];

export default function Reminders() {
  const { units, language } = usePrefs();
  const t = useT();
  const r = t.reminders;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % 3), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const messages = r.messages(units.fmt(900)).map((text, i) => ({ time: clockTime(...TIMES[i], language.id), text }));
  const msg = messages[index];

  return (
    <main className="screen">
      <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-end', padding: '50px 16px 0' }}>
        <Link to={ROUTES.weeklyRead} className="text-link">{t.common.skip}</Link>
      </div>
      <h1 className="title" style={{ marginTop: 4 }}>{r.title}</h1>
      <p className="lede" style={{ marginInline: 36 }}>{r.lede}</p>

      <div style={{ position: 'relative', width: 342, maxWidth: 'calc(100% - 32px)', height: 400, marginTop: 28, borderRadius: 30, border: '3px solid var(--ink)', background: 'var(--sky)', boxShadow: '0 6px 0 var(--ink)', overflow: 'hidden' }}>
        <div aria-live="polite" style={{ position: 'absolute', left: 20, right: 20, top: 22 }}>
          <div key={index} className="swap" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 20, background: '#FFFFFF', border: '2.5px solid var(--ink)' }}>
            <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, background: 'var(--water)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={strayImg} alt="" style={{ width: 34, height: 38 }} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                <span>Stray</span>
                <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{msg.time}</span>
              </span>
              <span style={{ fontSize: 16, lineHeight: 1.3 }}>{msg.text}</span>
            </span>
          </div>
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }}>
          <Wave layer="back" fill="#A9D3FB" style={{ top: -16, height: 18, animationDuration: '7s' }} />
          <Wave fill="#4FA3F7" style={{ top: -10, height: 12, animationDuration: '4s' }} />
          <div className="layer" style={{ background: 'var(--water)' }} />
        </div>
        <img src={strayImg} alt={r.alt} style={{ position: 'absolute', left: '50%', marginLeft: -95, bottom: 34, width: 190, height: 212 }} />
      </div>

      <div style={{ display: 'flex', gap: 2, marginTop: 14 }}>
        {messages.map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setIndex(n)}
            aria-label={r.show(n + 1, messages.length)}
            aria-pressed={n === index}
            style={{ width: 44, height: 44, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ display: 'block', width: n === index ? 26 : 10, height: 10, borderRadius: 5, background: n === index ? 'var(--ink)' : '#B5BCD3', transition: 'width .3s' }} />
          </button>
        ))}
      </div>

      <Link to={ROUTES.weeklyRead} className="btn btn-primary btn-cta tap">
        {r.cta}
      </Link>
    </main>
  );
}
