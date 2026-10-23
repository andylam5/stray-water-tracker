import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MinusIcon, PlusIcon } from '../components/Icons';
import { Sheet } from '../components/Sheet';
import { useT } from '../i18n';
import { readKey, usePrefs, writeKey } from '../lib/storage';
import { ROUTES } from '../lib/routes';
import { ML_PER_OZ } from '../lib/units';

type Sex = 'female' | 'male' | 'none';
type Activity = 'low' | 'medium' | 'high';
type Climate = 'cool' | 'temperate' | 'hot';

interface Answers {
  sex: Sex | null;
  weightKg: number | null;
  activity: Activity;
  climate: Climate;
  /** Overrides the calculation when set, ml. */
  custom: number | null;
}

type SheetKind = 'sex' | 'weight' | 'activity' | 'climate' | 'custom';

const DEFAULTS: Answers = { sex: null, weightKg: null, activity: 'medium', climate: 'temperate', custom: null };
const LB_PER_KG = 2.20462;
const SKIP_GOAL_ML = 2000;

/** A starting point, not medical advice: ~30 ml per kg, adjusted for sex, activity and climate. */
function calculate(a: Answers) {
  if (a.custom) return { ml: a.custom, kind: 'custom' as const };
  let ml = a.weightKg ? a.weightKg * 30 : 2000;
  ml += { female: 0, male: 300, none: 0 }[a.sex ?? 'none'];
  ml += { low: -200, medium: 0, high: 500 }[a.activity];
  ml += { cool: -100, temperate: 0, hot: 500 }[a.climate];
  const personal = a.weightKg || a.sex || a.activity !== 'medium' || a.climate !== 'temperate';
  return { ml: Math.round(ml / 50) * 50, kind: personal ? ('personal' as const) : ('common' as const) };
}

function loadAnswers(): Answers {
  try {
    return { ...DEFAULTS, ...JSON.parse(readKey('goalAnswers') ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

/** Eases a number toward its target so the goal visibly counts up or down. */
function useTween(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      const v = begin + (target - begin) * (1 - Math.pow(1 - t, 3));
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

export default function Goal() {
  const { units, setGoal } = usePrefs();
  const t = useT();
  const g = t.goal;
  const navigate = useNavigate();
  const fromSettings = (useLocation().state as { from?: string } | null)?.from === 'settings';
  const next = fromSettings ? ROUTES.home : ROUTES.reminders;

  const [answers, setAnswers] = useState<Answers>(loadAnswers);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [info, setInfo] = useState(false);
  const [customDraft, setCustomDraft] = useState(0);

  const { ml, kind } = calculate(answers);
  const shown = useTween(ml);
  const update = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));

  const save = () => {
    setGoal(ml);
    writeKey('goalAnswers', JSON.stringify(answers));
    navigate(next);
  };
  const skip = () => {
    if (!fromSettings) setGoal(SKIP_GOAL_ML);
    navigate(next);
  };

  const weightLabel = answers.weightKg
    ? units.isOz ? `${Math.round(answers.weightKg * LB_PER_KG)} lb` : `${Math.round(answers.weightKg)} kg`
    : g.sheets.weight;
  const pills: { kind: SheetKind; label: string; filled: boolean; icon: ReactNode }[] = [
    { kind: 'sex', label: answers.sex ? g.sex[answers.sex][0] : g.sheets.sex, filled: !!answers.sex, icon: <path d="M8.5 14c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2M9 9.5h.01M15 9.5h.01" /> },
    { kind: 'weight', label: weightLabel, filled: !!answers.weightKg, icon: <><rect x="3.5" y="4" width="17" height="16" rx="4" /><path d="M8.5 10a3.5 3.5 0 0 1 7 0M12 10l1.5-2" /></> },
    { kind: 'activity', label: g.activity[answers.activity][0], filled: true, icon: <path d="M13 3L5 13.5h6l-1 7.5 8-10.5h-6z" /> },
    { kind: 'climate', label: g.climate[answers.climate][0], filled: true, icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></> },
  ];

  const open = (k: SheetKind) => {
    if (k === 'weight' && !answers.weightKg) update({ weightKg: 65, custom: null });
    if (k === 'custom') setCustomDraft(answers.custom ?? ml);
    setSheet(k);
  };

  const choiceSheet = sheet === 'sex' || sheet === 'activity' || sheet === 'climate';
  const choices = sheet === 'sex' ? g.sex : sheet === 'activity' ? g.activity : sheet === 'climate' ? g.climate : null;
  const current = sheet === 'sex' ? answers.sex : sheet === 'activity' ? answers.activity : sheet === 'climate' ? answers.climate : null;

  const step = units.isOz ? 4 * ML_PER_OZ : 100;
  const [minCustom, maxCustom] = units.isOz ? [32 * ML_PER_OZ, 160 * ML_PER_OZ] : [1000, 5000];
  const weightShown = Math.round((answers.weightKg ?? 65) * (units.isOz ? LB_PER_KG : 1));
  const stepLabel = units.fmt(step);

  return (
    <main className="screen">
      <span aria-hidden="true" className="cube" style={{ '--r': '18deg', left: 18, top: 150, width: 54, height: 54, borderRadius: 14 } as CSSProperties} />
      <span aria-hidden="true" className="cube" style={{ '--r': '-14deg', right: -16, top: 300, width: 72, height: 72, borderRadius: 18, animationDelay: '-2s', animationDuration: '8s' } as CSSProperties} />
      <span aria-hidden="true" className="cube" style={{ '--r': '30deg', left: -22, top: 560, width: 64, height: 64, borderRadius: 16, animationDelay: '-4s' } as CSSProperties} />
      <span aria-hidden="true" className="cube" style={{ '--r': '-8deg', right: 30, top: 640, width: 40, height: 40, borderRadius: 11, animationDelay: '-1s', animationDuration: '6s' } as CSSProperties} />

      <div style={{ position: 'relative', alignSelf: 'stretch', height: 64, marginTop: 44 }}>
        {fromSettings ? (
          <Link to={ROUTES.home} className="text-link" style={{ position: 'absolute', right: 16, top: 4 }}>{t.common.cancel}</Link>
        ) : (
          <button type="button" onClick={skip} className="text-link" style={{ position: 'absolute', right: 16, top: 4, border: 0, background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>{t.common.skip}</button>
        )}
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, marginTop: 90 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--muted)' }}>{g.kind[kind]}</span>
        <button type="button" onClick={() => setInfo(!info)} aria-expanded={info} aria-label={g.infoLabel} style={{ width: 32, height: 32, padding: 0, border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
        </button>
      </div>
      <span aria-live="polite" style={{ marginTop: -2, fontSize: 64, fontWeight: 800, lineHeight: 1, color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
        {units.show(shown)}<span style={{ fontSize: 30 }}> {units.unit}</span>
      </span>
      <span style={{ marginTop: 6, fontSize: 19, fontWeight: 700 }}>{g.heading}</span>
      {info && (
        <p className="pop" style={{ position: 'relative', zIndex: 2, margin: '10px 32px 0', padding: '10px 14px', borderRadius: 16, background: '#EEF4FD', fontSize: 15, lineHeight: 1.4, textAlign: 'center' }}>
          {g.info}
        </p>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12, width: 300, marginTop: 26 }}>
        {pills.map((p) => (
          <button key={p.kind} type="button" className="goal-pill" data-filled={p.filled} onClick={() => open(p.kind)} aria-haspopup="dialog">
            <span style={{ flexGrow: 1 }}>{p.label}</span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {p.kind === 'sex' && <circle cx="12" cy="12" r="9" />}
              {p.icon}
            </svg>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => open('custom')} aria-haspopup="dialog" style={{ position: 'relative', zIndex: 1, marginTop: 10, height: 44, padding: '0 16px', border: 0, background: 'transparent', fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--blue)', cursor: 'pointer' }}>
        {answers.custom ? g.customValue(units.fmt(answers.custom)) : g.sheets.custom}
      </button>

      <button type="button" onClick={save} className="btn btn-primary btn-cta tap" style={{ position: 'relative', zIndex: 1 }}>
        {g.save}
      </button>

      {sheet && (
        <Sheet title={g.sheets[sheet]} onClose={() => setSheet(null)}>
          <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {choiceSheet && choices && (
              <div role="radiogroup" aria-label={g.sheets[sheet]} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(choices).map(([id, [title, desc]]) => (
                  <button key={id} type="button" role="radio" aria-checked={id === current} className="choice" onClick={() => update({ [sheet]: id, custom: null } as Partial<Answers>)}>
                    <span aria-hidden="true" className="choice-dot" />
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{title}</span>
                      {desc && <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.3 }}>{desc}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {sheet === 'weight' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {weightShown}<span style={{ fontSize: 24, color: 'var(--muted)' }}> {units.isOz ? 'lb' : 'kg'}</span>
                </span>
                <input
                  type="range"
                  aria-label={units.isOz ? g.weightIn.lb : g.weightIn.kg}
                  min={units.isOz ? 77 : 35}
                  max={units.isOz ? 400 : 180}
                  step={1}
                  value={weightShown}
                  onChange={(e) => update({ weightKg: Number(e.target.value) / (units.isOz ? LB_PER_KG : 1), custom: null })}
                  style={{ width: '100%', height: 44, accentColor: 'var(--blue)', margin: 0 }}
                />
                <button type="button" className="quiet-btn" onClick={() => { update({ weightKg: null }); setSheet(null); }}>{g.weightSkip}</button>
              </div>
            )}

            {sheet === 'custom' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '8px 0' }}>
                  <button type="button" className="stepper tap" aria-label={g.lower(stepLabel)} onClick={() => setCustomDraft((v) => Math.max(minCustom, v - step))}>
                    <MinusIcon />
                  </button>
                  <span aria-live="polite" style={{ minWidth: 150, textAlign: 'center', fontSize: 46, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {units.show(customDraft)}<span style={{ fontSize: 22, color: 'var(--muted)' }}> {units.unit}</span>
                  </span>
                  <button type="button" className="stepper tap" aria-label={g.raise(stepLabel)} onClick={() => setCustomDraft((v) => Math.min(maxCustom, v + step))}>
                    <PlusIcon size={22} strokeWidth={3} />
                  </button>
                </div>
                <button type="button" className="quiet-btn" style={{ alignSelf: 'center' }} onClick={() => { update({ custom: null }); setSheet(null); }}>
                  {g.useCalculated}
                </button>
              </>
            )}

            <button
              type="button"
              className="btn btn-primary tap"
              style={{ marginTop: 6, height: 56, borderRadius: 18, fontSize: 19 }}
              onClick={() => {
                if (sheet === 'custom') update({ custom: Math.round(customDraft) });
                setSheet(null);
              }}
            >
              {t.common.done}
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
