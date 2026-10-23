import { Link } from 'react-router-dom';
import { OutlineGlass } from '../components/Icons';
import { Surface } from '../components/LiquidBands';
import { useT } from '../i18n';
import { usePrefs } from '../lib/storage';
import { ROUTES } from '../lib/routes';

const DROP_STYLE = {
  position: 'absolute',
  width: 9,
  height: 16,
  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
  background: 'var(--water)',
  border: '2px solid var(--ink)',
} as const;

export default function Filled() {
  const { units, firstSip } = usePrefs();
  const t = useT();
  const fill = Math.max(8, Math.min(60, (firstSip / 2000) * 100));

  return (
    <main className="screen">
      <span style={{ marginTop: 96, fontSize: 60, fontWeight: 800, lineHeight: 1, color: 'var(--blue)' }}>{units.fmt(firstSip)}</span>
      <span style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>{t.filled.sub}</span>

      <div role="img" aria-label={t.filled.alt(units.fmt(firstSip))} className="cat-stage" style={{ marginTop: 44 }}>
        <div className="cat cat-empty" />
        <div className="cat layer" style={{ overflow: 'hidden' }}>
          <div className="fill-rise" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill.toFixed(1)}%` }}>
            <div className="slosh" style={{ position: 'absolute', left: 0, width: '100%', top: -18, height: 20 }}>
              <Surface top="#4FA3F7" light="#A9D3FB" />
            </div>
            <div className="layer" style={{ background: 'var(--water)' }} />
          </div>
        </div>
        <p className="speech pop" style={{ right: -24, top: -8, borderRadius: '18px 18px 18px 4px', padding: '6px 12px', fontSize: 16, animationDelay: '1.6s' }}>
          {t.filled.speech}
        </p>
      </div>

      <div aria-hidden="true" style={{ position: 'relative', width: 58, height: 74, marginTop: 30 }}>
        <span className="drop-l" style={{ ...DROP_STYLE, left: 14, top: -6 }} />
        <span className="drop-c" style={{ ...DROP_STYLE, left: 24, top: -10 }} />
        <span className="drop-r" style={{ ...DROP_STYLE, left: 34, top: -6 }} />
        <OutlineGlass id="filled-cup" fillY={48} />
      </div>

      <Link to={ROUTES.goal} className="btn btn-primary btn-cta tap" style={{ height: 58 }}>
        {t.common.continue}
      </Link>
    </main>
  );
}
