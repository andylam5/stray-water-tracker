import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}

export function PlusIcon({ size = 18, stroke = 'currentColor', strokeWidth = 4 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

export function MinusIcon({ size = 22 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BackIcon({ size = 20 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function GlobeIcon({ size = 20 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
    </svg>
  );
}

/** Three wavy lines: Stray's settings glyph. */
export function WavesIcon({ size = 22 }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M3 8c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0M3 13c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0M3 18c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
    </svg>
  );
}

/** Up/down chevrons on the pour handle. */
export function DragHandle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`vhandle ${className ?? ''}`} aria-hidden="true" style={style}>
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="#1E2340" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6l4-4 4 4M2 10l4 4 4-4" />
      </svg>
    </div>
  );
}

const CUP = 'M6 6h46l-6 58a6 6 0 0 1-6 5H18a6 6 0 0 1-6-5z';

/** The outlined glass used on the onboarding screens, filled from `fillY` down. */
export function OutlineGlass({ id, fillY }: { id: string; fillY: number }) {
  return (
    <svg aria-hidden="true" width="58" height="74" viewBox="0 0 58 74" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <clipPath id={id}>
          <path d={CUP} />
        </clipPath>
      </defs>
      <path d={CUP} fill="#FFFFFF" />
      <g clipPath={`url(#${id})`}>
        <rect x="0" y={fillY} width="58" height={78 - fillY} fill="#4FA3F7" />
      </g>
      <path d={CUP} fill="none" stroke="#1E2340" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}
