import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePourDrag } from '../hooks/usePourDrag';
import { useT, type Messages } from '../i18n';
import { DRINKS, type Drink, type DrinkKey, type VesselShape } from '../lib/drinks';
import type { UnitHelpers } from '../lib/units';
import { CloseIcon, DragHandle, PlusIcon } from './Icons';
import { AmountReadout, PresetChips } from './PourControls';
import { Wave } from './Wave';

const MAX_ML = 750;
const SIZE = 280;
/** Vessels are drawn on a 64-unit grid scaled up to 280px. */
const K = SIZE / 64;

interface Vessel {
  clip: string;
  /** Top and bottom of the fillable interior, in 64-unit grid coordinates. */
  span: [number, number];
  handleLeft: number;
  /** Which pour hint to show. */
  word: keyof Messages['pour']['hint'];
  /** Drawn behind / in front of the liquid, on the 64-unit grid. */
  under?: (d: Drink) => ReactNode;
  over?: ReactNode;
}

const GLASS = 'M56.9 35 L223.1 35 L203 243.2 Q201.2 262.5 182 262.5 L98 262.5 Q78.8 262.5 77 243.2 Z';

const VESSELS: Record<VesselShape, Vessel> = {
  glass: { clip: GLASS, span: [8, 60], handleLeft: 140, word: 'glass' },
  teacup: {
    clip: 'M35 87.5 L201.2 87.5 L185.9 201.2 Q181.6 227.5 155.3 227.5 L80.9 227.5 Q54.7 227.5 50.3 201.2 Z M195.1 105 L218.8 105 Q249.4 105 249.4 140 Q249.4 175 218.8 175 L188.1 175 L189.4 157.5 L218.8 157.5 Q231.9 157.5 231.9 140 Q231.9 122.5 218.8 122.5 L192.9 122.5 Z',
    span: [20, 52],
    handleLeft: 118,
    word: 'cup',
    under: (d) => <rect x="4" y="53" width="48" height="5" rx="2.5" fill={d.light} />,
    over: (
      <>
        <path d="M17.2 37 h10.6 l1.2 10 a2 2 0 0 1 -2 2.2 h-9 a2 2 0 0 1 -2 -2.2 z" fill="#FFF8EC" stroke="#9A6A2E" strokeWidth={0.9} strokeLinejoin="round" />
        <path d="M22.5 37 C19.5 30.5 14.5 24.5 10.2 21.1 Q8.6 19.6 7.5 21.4 L5.9 24.4" fill="none" stroke="#9A6A2E" strokeWidth={0.9} strokeLinecap="round" />
        <rect x="2" y="24.2" width="7" height="7.6" rx="1.4" fill="#FFFFFF" stroke="#9A6A2E" strokeWidth={0.9} />
      </>
    ),
  },
  togo: {
    clip: 'M74.4 78.8 L205.6 78.8 L189.9 243.2 Q188.1 262.5 168.9 262.5 L111.1 262.5 Q91.9 262.5 90.1 243.2 Z',
    span: [20, 60],
    handleLeft: 140,
    word: 'cup',
    over: (
      <>
        <rect x="13" y="10" width="38" height="10" rx="4" fill="#EADFCB" />
        <rect x="20" y="6" width="24" height="6" rx="3" fill="#EADFCB" />
      </>
    ),
  },
  straw: {
    clip: 'M52.5 70 L227.5 70 L207.4 243.2 Q205.6 262.5 186.4 262.5 L93.6 262.5 Q74.4 262.5 72.6 243.2 Z',
    span: [16, 60],
    handleLeft: 140,
    word: 'cup',
    over: <path d="M34 34L48 4" stroke="#F48FA6" strokeWidth={4} strokeLinecap="round" />,
  },
  carton: {
    clip: 'M78.8 96.2 L218.8 96.2 L218.8 245 Q218.8 262.5 201.2 262.5 L96.2 262.5 Q78.8 262.5 78.8 245 Z',
    span: [22, 60],
    handleLeft: 149,
    word: 'carton',
    over: (
      <>
        <path d="M25 10h18l7 12H18z" fill="#DCCFB8" />
        <rect x="29" y="4" width="10" height="7" rx="2" fill="#4FA3F7" />
      </>
    ),
  },
  can: {
    clip: 'M70 52.5 Q70 35 87.5 35 L192.5 35 Q210 35 210 52.5 L210 245 Q210 262.5 192.5 262.5 L87.5 262.5 Q70 262.5 70 245 Z',
    span: [12, 60],
    handleLeft: 140,
    word: 'can',
    over: (
      <>
        <rect x="16" y="7" width="32" height="5" rx="2.5" fill="#D7DBE6" />
        <rect x="27" y="4" width="10" height="4" rx="2" fill="none" stroke="#B5BCD3" strokeWidth={1.2} />
      </>
    ),
  },
  wine: {
    clip: 'M61.2 35 L218.8 35 Q227.5 131.2 140 166.2 Q52.5 131.2 61.2 35 Z',
    span: [8, 38],
    handleLeft: 140,
    word: 'glass',
    under: () => (
      <>
        <rect x="30.5" y="36" width="3" height="18" fill="#C9CEE0" />
        <rect x="21" y="53" width="22" height="4" rx="2" fill="#C9CEE0" />
      </>
    ),
  },
  mug: {
    clip: 'M43.8 52.5 L192.5 52.5 L192.5 236.2 Q192.5 262.5 166.2 262.5 L70 262.5 Q43.8 262.5 43.8 236.2 Z M190.3 87.5 L218.8 87.5 Q253.8 87.5 253.8 126.9 L253.8 161.9 Q253.8 201.2 218.8 201.2 L190.3 201.2 L190.3 179.4 L218.8 179.4 Q231.9 179.4 231.9 161.9 L231.9 126.9 Q231.9 109.4 218.8 109.4 L190.3 109.4 Z',
    span: [12, 60],
    handleLeft: 118,
    word: 'mug',
  },
  small: {
    clip: 'M61.2 140 L192.5 140 L181.6 218.8 Q178.5 236.2 159.7 236.2 L94.1 236.2 Q75.2 236.2 72.2 218.8 Z M189.4 153.1 L210 153.1 Q236.2 153.1 236.2 179.4 Q236.2 205.6 210 205.6 L182.9 205.6 L184.6 190.3 L210 190.3 Q220.9 190.3 220.9 179.4 Q220.9 168.4 210 168.4 L187.2 168.4 Z',
    span: [32, 54],
    handleLeft: 127,
    word: 'cup',
    under: (d) => <rect x="8" y="55" width="42" height="4" rx="2" fill={d.light} />,
  },
  bottle: {
    clip: 'M105 35 L175 35 L175 61.2 Q210 78.8 210 113.8 L210 245 Q210 262.5 192.5 262.5 L87.5 262.5 Q70 262.5 70 245 L70 113.8 Q70 78.8 105 61.2 Z',
    span: [14, 60],
    handleLeft: 140,
    word: 'bottle',
    over: <rect x="25" y="2" width="14" height="7" rx="2" fill="#1E2340" />,
  },
};

const FIZZ = [
  { left: '34%', size: 12, delay: '0s', dur: '2.4s' },
  { left: '52%', size: 9, delay: '.6s', dur: '2s' },
  { left: '62%', size: 14, delay: '1.2s', dur: '2.8s' },
  { left: '44%', size: 8, delay: '1.8s', dur: '2.2s' },
];

interface DrinkSheetProps {
  drink: DrinkKey;
  units: UnitHelpers;
  onClose: () => void;
  onConfirm: (ml: number) => void;
}

/** Full-screen sheet to pour a drink by dragging inside its vessel. */
export function DrinkSheet({ drink, units, onClose, onConfirm }: DrinkSheetProps) {
  const d = DRINKS[drink];
  const v = VESSELS[d.shape];
  const t = useT();
  const [name] = t.drinks[drink];
  const [amount, setAmount] = useState(() => units.snap(d.ml));
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [top, bottom] = v.span;
  const baseOffset = (64 - bottom) * K;
  const geometry = (ml: number) => {
    const f = 0.1 + (Math.min(ml, MAX_ML) / MAX_ML) * 0.82;
    const h = (bottom - top) * K * f;
    return { height: `${h.toFixed(1)}px`, handleBottom: `${(baseOffset + h).toFixed(1)}px` };
  };

  const { vesselRef, numRef, handlers } = usePourDrag({
    amount,
    onChange: setAmount,
    maxMl: MAX_ML,
    units,
    geometry,
    amountAtY: (clientY, r) => {
      const y = (clientY - r.top) / (r.height / SIZE);
      const t = top * K;
      const b = bottom * K;
      return (((b - y) / (b - t) - 0.1) / 0.82) * MAX_ML;
    },
  });

  const g = geometry(amount);
  const shown = units.snap(amount);

  return (
    <div className="sheet-full" role="dialog" aria-modal="true" aria-label={t.pour.add(name)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 24px 0' }}>
        <span style={{ fontSize: 22, fontWeight: 800 }}>{name}</span>
        <button ref={closeRef} type="button" className="icon-btn tap" onClick={onClose} aria-label={t.common.close}>
          <CloseIcon />
        </button>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={t.pour.amount(name, t.unitNames[units.unit])}
        aria-valuemin={Math.round(units.minMl)}
        aria-valuemax={MAX_ML}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={units.fmt(shown)}
        ref={vesselRef}
        {...handlers}
        onPointerCancel={handlers.onPointerUp}
        className="vessel"
        style={{ width: SIZE, height: SIZE, marginTop: 40 }}
      >
        {v.under && (
          <svg aria-hidden="true" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, width: SIZE, height: SIZE }}>
            {v.under(d)}
          </svg>
        )}
        {/* Unfilled interior: the drink's light tint at 40% so every vessel reads as see-through. */}
        <div style={{ position: 'absolute', inset: 0, background: `${d.light}66`, clipPath: `path('${v.clip}')` }}>
          <div className="lvl js-level" style={{ position: 'absolute', left: 0, right: 0, bottom: baseOffset, height: g.height }}>
            <Wave layer="back" fill={d.light} style={{ top: -18, height: 20 }} />
            <Wave fill={d.c} style={{ top: -12, height: 14, animationDuration: '3.2s' }} />
            <div className="layer" style={{ background: d.c }} />
            {d.fizzy && (
              <span aria-hidden="true" className="layer" style={{ overflow: 'hidden' }}>
                {FIZZ.map((b, i) => (
                  <span key={i} className="fz" style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.dur }} />
                ))}
              </span>
            )}
          </div>
        </div>
        {v.over && (
          <svg aria-hidden="true" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, width: SIZE, height: SIZE }}>
            {v.over}
          </svg>
        )}
        <DragHandle className="js-handle" style={{ left: v.handleLeft, bottom: g.handleBottom }} />
      </div>

      <div style={{ marginTop: 20 }}>
        <AmountReadout numRef={numRef} amount={amount} units={units} />
      </div>
      <PresetChips amount={amount} units={units} onPick={setAmount} />
      <span className="hint" style={{ marginTop: 12 }}>{t.pour.hint[v.word]}</span>
      <span className="hint" style={{ marginTop: 2, fontSize: 14 }}>
        {d.hydration > 0 ? t.pour.counts(Math.round(d.hydration * 100), d.caffeine) : t.pour.noAlcohol}
      </span>

      <button
        type="button"
        className="btn btn-pill tap"
        onClick={() => onConfirm(shown)}
        style={{ marginTop: 'auto', marginBottom: 44, background: d.c, color: d.dark ? '#FFFFFF' : 'var(--ink)' }}
      >
        <PlusIcon />
        {name}
      </button>
    </div>
  );
}
