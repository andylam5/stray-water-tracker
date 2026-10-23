export interface Band {
  c: string;
  bottom: string;
  h: string;
  z: number;
  wave: boolean;
  delay: string;
}

/**
 * Stacks colored layers bottom-up. Each layer overlaps the next by a few px so the
 * wavy seam between drinks covers the hard edge underneath.
 */
export function rippleBands(items: { c: string; px: number }[]): Band[] {
  let cum = 0;
  return items.map((it, i) => {
    const last = i === items.length - 1;
    const lo = i === 0 ? cum : cum - 5;
    const hi = last ? cum + it.px + 1 : cum + it.px - 5;
    cum += it.px;
    return {
      c: it.c,
      bottom: `${lo.toFixed(1)}px`,
      h: `${Math.max(0, hi - lo).toFixed(1)}px`,
      z: items.length - i,
      wave: !last,
      delay: `${(-i * 0.8).toFixed(1)}s`,
    };
  });
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
