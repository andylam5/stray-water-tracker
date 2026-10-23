import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { UnitHelpers } from '../lib/units';

interface PourDragOptions {
  /** Current amount in ml (unsnapped). */
  amount: number;
  /** Called with the snapped amount when a drag settles or a key is pressed. */
  onChange: (ml: number) => void;
  maxMl: number;
  units: UnitHelpers;
  /** Liquid height and handle offset (CSS lengths) for an amount. */
  geometry: (ml: number) => { height: string; handleBottom: string };
  /** Amount for a pointer position inside the vessel. */
  amountAtY: (clientY: number, rect: DOMRect) => number;
}

/**
 * Drag up/down inside a vessel to pour. While dragging, the liquid eases toward the
 * pointer via rAF and writes straight to the DOM (no React renders per frame); React
 * state only updates once the level settles.
 *
 * The vessel must contain `.js-level` (liquid) and `.js-handle` (grip) elements.
 */
export function usePourDrag(opts: PourDragOptions) {
  const vesselRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const optsRef = useRef(opts);
  useLayoutEffect(() => {
    optsRef.current = opts;
  });
  const s = useRef({ dragging: false, cur: 0, target: 0, loop: 0 });

  useEffect(() => {
    const state = s.current;
    return () => cancelAnimationFrame(state.loop);
  }, []);

  const clamp = (ml: number) => {
    const { units, maxMl } = optsRef.current;
    return Math.max(units.minMl, Math.min(maxMl, ml));
  };

  const apply = (ml: number) => {
    const el = vesselRef.current;
    if (!el) return;
    const g = optsRef.current.geometry(ml);
    const liquid = el.querySelector<HTMLElement>('.js-level');
    const handle = el.querySelector<HTMLElement>('.js-handle');
    if (liquid) liquid.style.height = g.height;
    if (handle) handle.style.bottom = g.handleBottom;
    numRef.current?.setAttribute('data-v', optsRef.current.units.show(ml));
  };

  const run = () => {
    if (s.current.loop) return;
    const step = () => {
      const st = s.current;
      let c = st.cur + (st.target - st.cur) * 0.28;
      if (Math.abs(st.target - c) < 0.4) c = st.target;
      st.cur = c;
      apply(c);
      if (st.dragging || c !== st.target) {
        st.loop = requestAnimationFrame(step);
        return;
      }
      st.loop = 0;
      const settled = optsRef.current.units.snap(c);
      apply(settled);
      vesselRef.current?.classList.remove('vdrag');
      optsRef.current.onChange(settled);
    };
    s.current.loop = requestAnimationFrame(step);
  };

  const targetFor = (clientY: number) => {
    const el = vesselRef.current!;
    return clamp(optsRef.current.amountAtY(clientY, el.getBoundingClientRect()));
  };

  return {
    vesselRef,
    numRef,
    handlers: {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        const el = vesselRef.current;
        if (!el) return;
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        s.current.dragging = true;
        el.classList.add('vdrag');
        if (!s.current.loop) s.current.cur = optsRef.current.amount;
        s.current.target = targetFor(e.clientY);
        run();
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        if (s.current.dragging) s.current.target = targetFor(e.clientY);
      },
      onPointerUp: () => {
        if (!s.current.dragging) return;
        s.current.dragging = false;
        s.current.target = optsRef.current.units.snap(s.current.target);
      },
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        const { units, amount, onChange } = optsRef.current;
        const st = units.stepMl;
        const delta = ({ ArrowUp: st, ArrowRight: st, ArrowDown: -st, ArrowLeft: -st, PageUp: 5 * st, PageDown: -5 * st } as Record<string, number>)[e.key];
        if (!delta) return;
        e.preventDefault();
        onChange(clamp(units.snap(amount) + delta));
      },
    },
  };
}
