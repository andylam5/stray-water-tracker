import type { CSSProperties } from 'react';

const FRONT = 'M0 20 Q50 4 100 20 T200 20 T300 20 T400 20 T500 20 T600 20 T700 20 T800 20 V40 H0Z';
const BACK = 'M0 20 Q50 2 100 20 T200 20 T300 20 T400 20 T500 20 T600 20 T700 20 T800 20 V40 H0Z';

interface WaveProps {
  fill: string;
  /** `front` drifts left fast; `back` drifts right slowly behind it. */
  layer?: 'front' | 'back';
  style?: CSSProperties;
}

/** A 200%-wide wave strip that loops by sliding half its width. */
export function Wave({ fill, layer = 'front', style }: WaveProps) {
  return (
    <svg
      aria-hidden="true"
      className={layer === 'front' ? 'wv' : 'wv2'}
      viewBox="0 0 800 40"
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, width: '200%', ...style }}
    >
      <path d={layer === 'front' ? FRONT : BACK} fill={fill} style={{ transition: 'fill .4s' }} />
    </svg>
  );
}
