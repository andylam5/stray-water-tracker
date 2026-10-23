import type { CSSProperties } from 'react';
import type { Band } from '../lib/bands';
import { Wave } from './Wave';

/** Colored drink layers stacked inside the cat silhouette. */
export function LiquidBands({ bands }: { bands: Band[] }) {
  return (
    <>
      {bands.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: b.bottom, height: b.h, zIndex: b.z }}>
          <div style={{ position: 'absolute', inset: 0, background: b.c }} />
          {b.wave && (
            <Wave fill={b.c} style={{ top: -10, height: 12, animationDuration: '3.2s', animationDelay: b.delay }} />
          )}
        </div>
      ))}
    </>
  );
}

/** Two-layer wavy surface that sits on top of the liquid. */
export function Surface({ top, light, frontStyle }: { top: string; light: string; frontStyle?: CSSProperties }) {
  return (
    <>
      <Wave layer="back" fill={light} style={{ bottom: 2, height: 16 }} />
      <Wave fill={top} style={{ bottom: -1, height: 11, ...frontStyle }} />
    </>
  );
}
