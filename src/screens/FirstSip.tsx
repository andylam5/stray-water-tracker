import { Link } from 'react-router-dom';
import { OutlineGlass, PlusIcon } from '../components/Icons';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

export default function FirstSip() {
  const t = useT();
  return (
    <main className="screen">
      <h1 className="title" style={{ marginTop: 100 }}>{t.firstSip.title}</h1>
      <p className="lede">{t.firstSip.lede}</p>
      <div role="img" aria-label={t.firstSip.emptyAlt} className="cat-stage" style={{ marginTop: 44 }}>
        <div className="cat cat-empty" />
      </div>
      <Link
        to={ROUTES.pour}
        className="tap nudge"
        aria-label={t.firstSip.addWater}
        style={{ marginTop: 'auto', marginBottom: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 16px', textDecoration: 'none', color: 'var(--ink)' }}
      >
        <span style={{ position: 'relative', display: 'block', width: 58, height: 74 }}>
          <OutlineGlass id="first-sip-cup" fillY={20} />
          <span
            aria-hidden="true"
            style={{ position: 'absolute', left: '50%', bottom: -8, marginLeft: -15, width: 30, height: 30, borderRadius: '50%', background: 'var(--pink-soft)', border: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PlusIcon size={14} stroke="#1E2340" />
          </span>
        </span>
        <span style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>{t.drinks.water[0]}</span>
      </Link>
    </main>
  );
}
