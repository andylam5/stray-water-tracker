import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { usePrefs } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import type { Unit } from '../lib/units';

/** Bottom sheet asking ml vs oz, shown over the (dimmed) first-sip screen. */
export default function Units() {
  const { setUnit } = usePrefs();
  const navigate = useNavigate();
  const t = useT();

  const pick = (u: Unit) => {
    setUnit(u);
    navigate(ROUTES.firstSip);
  };

  return (
    <main className="screen">
      <h1 aria-hidden="true" className="title" style={{ marginTop: 100 }}>{t.firstSip.title}</h1>
      <div aria-hidden="true" className="cat-stage" style={{ marginTop: 70 }}>
        <div className="cat cat-empty" />
      </div>
      <div className="dim" aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(30, 35, 64, 0.5)' }} />
      <div
        className="sheet-up"
        role="dialog"
        aria-labelledby="units-title"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 28px 44px', background: '#FFFFFF', borderTop: '3px solid var(--ink)', borderRadius: '34px 34px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
      >
        <div aria-hidden="true" style={{ width: 44, height: 5, borderRadius: 3, background: '#C9CEE0' }} />
        <h2 id="units-title" style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.1, textAlign: 'center' }}>
          {t.units.title}
        </h2>
        <p style={{ margin: '-6px 0 6px', fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>{t.units.sub}</p>
        <button type="button" className="btn btn-water tap" style={{ alignSelf: 'stretch' }} onClick={() => pick('oz')}>
          oz <span style={{ fontWeight: 600 }}>({t.unitNames.oz})</span>
        </button>
        <button type="button" className="btn btn-water tap" style={{ alignSelf: 'stretch' }} onClick={() => pick('ml')}>
          ml <span style={{ fontWeight: 600 }}>({t.unitNames.ml})</span>
        </button>
      </div>
    </main>
  );
}
