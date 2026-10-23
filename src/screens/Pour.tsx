import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloseIcon, DragHandle, PlusIcon } from '../components/Icons';
import { AmountReadout, PresetChips } from '../components/PourControls';
import { Wave } from '../components/Wave';
import { usePourDrag } from '../hooks/usePourDrag';
import { useT } from '../i18n';
import { usePrefs } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import { ML_PER_OZ } from '../lib/units';

const MAX_ML = 600;
const VESSEL_W = 250;
const VESSEL_H = 330;

/** Liquid fills 12% (empty) to 92% (max) of the glass height. */
const levelPct = (ml: number) => `${(12 + (ml / MAX_ML) * 80).toFixed(2)}%`;

export default function Pour() {
  const { units, setFirstSip } = usePrefs();
  const t = useT();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(() => (units.isOz ? 12 * ML_PER_OZ : 330));
  // The glass starts empty and fills to the default amount, handle riding the surface.
  const [phase, setPhase] = useState<'empty' | 'filling' | 'ready'>('empty');

  useEffect(() => {
    const start = window.setTimeout(() => setPhase('filling'), 60);
    const end = window.setTimeout(() => setPhase('ready'), 1100);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, []);

  const { vesselRef, numRef, handlers } = usePourDrag({
    amount,
    onChange: setAmount,
    maxMl: MAX_ML,
    units,
    geometry: (ml) => ({ height: levelPct(ml), handleBottom: levelPct(ml) }),
    amountAtY: (clientY, r) => {
      const y = (clientY - r.top) / (r.height / VESSEL_H);
      return (((VESSEL_H - y) / VESSEL_H) * 100 - 12) / 80 * MAX_ML;
    },
  });

  const save = () => {
    const ml = Math.round(units.snap(amount));
    // Onboarding pour is a practice run: remember it for the next screen, never log it.
    setFirstSip(ml);
    navigate(ROUTES.filled);
  };

  const shown = units.snap(amount);
  const level = phase === 'empty' ? '0%' : levelPct(amount);

  return (
    <main className="screen">
      <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-end', padding: '56px 24px 0' }}>
        <Link to={ROUTES.firstSip} aria-label={t.common.close} className="icon-btn tap">
          <CloseIcon />
        </Link>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={t.pour.amount(t.drinks.water[0], t.unitNames[units.unit])}
        aria-valuemin={Math.round(units.minMl)}
        aria-valuemax={MAX_ML}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={units.fmt(shown)}
        ref={vesselRef}
        {...handlers}
        onPointerCancel={handlers.onPointerUp}
        className={phase === 'ready' ? 'vessel' : 'vessel intro-fill'}
        style={{ width: VESSEL_W, height: VESSEL_H, marginTop: 34 }}
      >
        <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', clipPath: 'polygon(4px 4px, 246px 4px, 214px 326px, 36px 326px)' }}>
          <div className="lvl js-level" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: level }}>
            <div className="layer">
              <Wave layer="back" fill="#A9D3FB" style={{ top: -18, height: 20 }} />
              <Wave fill="#4FA3F7" style={{ top: -12, height: 14 }} />
              <div className="layer" style={{ background: 'var(--water)' }} />
            </div>
          </div>
        </div>
        <svg aria-hidden="true" width={VESSEL_W} height={VESSEL_H} viewBox="0 0 250 330" style={{ position: 'absolute', inset: 0 }}>
          <path d="M4 4 H246 L215 318 Q214 326 206 326 H44 Q36 326 35 318 Z" fill="none" stroke="#1E2340" strokeWidth={4} strokeLinejoin="round" />
        </svg>
        <DragHandle className="js-handle" style={{ left: VESSEL_W / 2, bottom: level }} />
      </div>

      <div style={{ marginTop: 22 }}>
        <AmountReadout numRef={numRef} amount={amount} units={units} />
      </div>
      <PresetChips amount={amount} units={units} onPick={setAmount} />
      <span className="hint" style={{ marginTop: 12 }}>{t.pour.hint.glass}</span>

      <button type="button" className="btn btn-water btn-pill tap" style={{ marginTop: 'auto', marginBottom: 44 }} onClick={save}>
        <PlusIcon />
        {t.drinks.water[0]}
      </button>
    </main>
  );
}
