import type { RefObject } from 'react';
import type { UnitHelpers } from '../lib/units';

/** Big live number under the vessel. The digits are written by the drag loop via `data-v`. */
export function AmountReadout({ numRef, amount, units }: { numRef: RefObject<HTMLSpanElement | null>; amount: number; units: UnitHelpers }) {
  return (
    <span aria-live="polite" className="amount-readout">
      <span className="num" ref={numRef} data-v={units.show(amount)} />
      <span className="amount-unit"> {units.unit}</span>
    </span>
  );
}

/** Quick-pick amounts (150/250/330/500 ml or 5/8/12/16 oz). */
export function PresetChips({ amount, units, onPick }: { amount: number; units: UnitHelpers; onPick: (ml: number) => void }) {
  const current = units.snap(amount);
  return (
    <div className="preset-row">
      {units.presets.map((p) => {
        const selected = Math.abs(p.ml - current) < 1;
        return (
          <button key={p.label} type="button" className="chip" aria-pressed={selected} onClick={() => onPick(p.ml)}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
