import type { ReactNode } from 'react';
import type { Drink, VesselShape } from '../lib/drinks';

/** Icon artwork per vessel, on a 64-unit grid, tinted with the drink's colors. */
const ART: Record<VesselShape, (c: string, l: string) => ReactNode> = {
  glass: (c, l) => (
    <>
      <path d="M13 8 L51 8 L46.4 55.6 Q46 60 41.6 60 L22.4 60 Q18 60 17.6 55.6 Z" fill={c} />
      <path d="M13 8h38l-.9 8H13.9z" fill={l} />
    </>
  ),
  teacup: (c, l) => (
    <>
      <rect x="4" y="53" width="48" height="5" rx="2.5" fill={l} />
      <path d="M8 20 L46 20 L42.5 46 Q41.5 52 35.5 52 L18.5 52 Q12.5 52 11.5 46 Z" fill={c} />
      <path d="M44.6 24 L50 24 Q57 24 57 32 Q57 40 50 40 L43 40 L43.3 36 L50 36 Q53 36 53 32 Q53 28 50 28 L44.1 28 Z" fill={c} />
      <path d="M8 20h38l-.6 4.5H8.6z" fill={l} />
      <path d="M22 40 C19 32 14 25 10.2 21.2 Q8.6 19.6 7.4 21.4 L5.8 24.6" fill="none" stroke="#8A5A22" strokeWidth={1.6} strokeLinecap="round" />
      <rect x="1.6" y="24.4" width="7.4" height="8" rx="1.6" fill="#FFFFFF" stroke="#8A5A22" strokeWidth={1.4} />
    </>
  ),
  togo: (c) => (
    <>
      <path d="M17 18 L47 18 L43.4 55.6 Q43 60 38.6 60 L25.4 60 Q21 60 20.6 55.6 Z" fill={c} />
      <rect x="13" y="10" width="38" height="10" rx="4" fill="#EADFCB" />
      <rect x="20" y="6" width="24" height="6" rx="3" fill="#EADFCB" />
    </>
  ),
  straw: (c, l) => (
    <>
      <path d="M12 16 L52 16 L47.4 55.6 Q47 60 42.6 60 L21.4 60 Q17 60 16.6 55.6 Z" fill={c} />
      <path d="M38 16l10-12" stroke="#F48FA6" strokeWidth={4} strokeLinecap="round" />
      <path d="M12 16h40l-.9 8H12.9z" fill={l} />
    </>
  ),
  carton: (c) => (
    <>
      <path d="M18 22 L50 22 L50 56 Q50 60 46 60 L22 60 Q18 60 18 56 Z" fill={c} />
      <path d="M25 10h18l7 12H18z" fill="#DCCFB8" />
      <rect x="29" y="4" width="10" height="7" rx="2" fill="#4FA3F7" />
      <rect x="18" y="32" width="32" height="12" fill="#4FA3F7" />
    </>
  ),
  can: (c) => (
    <>
      <path d="M16 12 Q16 8 20 8 L44 8 Q48 8 48 12 L48 56 Q48 60 44 60 L20 60 Q16 60 16 56 Z" fill={c} />
      <rect x="16" y="8" width="32" height="5" rx="2.5" fill="#D7DBE6" />
      <rect x="16" y="30" width="32" height="9" fill="#FFFFFF" opacity=".85" />
    </>
  ),
  wine: (c) => (
    <>
      <rect x="30.5" y="36" width="3" height="18" fill="#C9CEE0" />
      <rect x="21" y="53" width="22" height="4" rx="2" fill="#C9CEE0" />
      <path d="M14 8 L50 8 Q52 30 32 38 Q12 30 14 8 Z" fill={c} />
    </>
  ),
  mug: (c, l) => (
    <>
      <path d="M10 12 L44 12 L44 54 Q44 60 38 60 L16 60 Q10 60 10 54 Z" fill={c} />
      <path d="M43.5 20 L50 20 Q58 20 58 29 L58 37 Q58 46 50 46 L43.5 46 L43.5 41 L50 41 Q53 41 53 37 L53 29 Q53 25 50 25 L43.5 25 Z" fill={c} />
      <path d="M10 12h34v6H10z" fill={l} />
    </>
  ),
  small: (c, l) => (
    <>
      <rect x="8" y="55" width="42" height="4" rx="2" fill={l} />
      <path d="M14 32 L44 32 L41.5 50 Q40.8 54 36.5 54 L21.5 54 Q17.2 54 16.5 50 Z" fill={c} />
      <path d="M43.3 35 L48 35 Q54 35 54 41 Q54 47 48 47 L41.8 47 L42.2 43.5 L48 43.5 Q50.5 43.5 50.5 41 Q50.5 38.5 48 38.5 L42.8 38.5 Z" fill={c} />
      <path d="M14 32h30l-.5 3.5H14.5z" fill={l} />
    </>
  ),
  bottle: (c) => (
    <>
      <path d="M24 8 L40 8 L40 14 Q48 18 48 26 L48 56 Q48 60 44 60 L20 60 Q16 60 16 56 L16 26 Q16 18 24 14 Z" fill={c} />
      <rect x="25" y="3" width="14" height="6" rx="2" fill="#1E2340" />
    </>
  ),
};

export function DrinkIcon({ drink, size = 64 }: { drink: Drink; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      {ART[drink.shape](drink.c, drink.light)}
    </svg>
  );
}
