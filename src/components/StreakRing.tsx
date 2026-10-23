import { useT } from '../i18n';

const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
const CIRCUMFERENCE = 125.66; // 2π × r(20)

/** Streak count with a ring showing progress to the next milestone. */
export function StreakRing({ days }: { days: number }) {
  const next = MILESTONES.find((m) => m > days) ?? days + 1;
  const left = next - days;
  const offset = CIRCUMFERENCE * (1 - days / next);
  const t = useT();

  return (
    <div role="img" aria-label={t.streak(days, left, next)} style={{ position: 'relative', width: 48, height: 48 }}>
      <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r="20" fill="none" stroke="#DCEBFF" strokeWidth={5} />
        <circle
          className="ring"
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#4FA3F7"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: offset.toFixed(2), opacity: days > 0 ? 1 : 0 }}
        />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {days}
      </span>
    </div>
  );
}
