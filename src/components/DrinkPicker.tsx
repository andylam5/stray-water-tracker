import { useRef } from 'react';
import { useT } from '../i18n';
import { DRINKS, LIGHT_BADGE, type DrinkKey } from '../lib/drinks';
import { DrinkIcon } from './DrinkIcon';
import { PlusIcon } from './Icons';

interface DrinkPickerProps {
  drinks: DrinkKey[];
  onPick: (k: DrinkKey) => void;
  /** Opens the beverages sheet from the trailing "Add or edit" tile. */
  onEdit: () => void;
}

/**
 * Horizontally scrolling row of drinks. Touch scrolls natively; with a mouse you can
 * drag the row or use the wheel, and a drag never counts as a tap.
 */
export function DrinkPicker({ drinks, onPick, onEdit }: DrinkPickerProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const endDrag = () => {
    if (!drag.current) return;
    if (rowRef.current) rowRef.current.style.scrollSnapType = 'x proximity';
    const d = drag.current;
    setTimeout(() => {
      if (drag.current === d) drag.current = null;
    }, 0);
  };

  return (
    <div
      ref={rowRef}
      className="drink-row"
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || !rowRef.current) return;
        drag.current = { x: e.clientX, left: rowRef.current.scrollLeft, moved: false };
        rowRef.current.style.scrollSnapType = 'none';
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !rowRef.current) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 5) d.moved = true;
        rowRef.current.scrollLeft = d.left - dx;
      }}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.preventDefault();
          e.stopPropagation();
        }
        drag.current = null;
      }}
      onWheel={(e) => {
        if (rowRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) rowRef.current.scrollLeft += e.deltaY;
      }}
    >
      {drinks.map((k) => {
        const d = DRINKS[k];
        const [name, short] = t.drinks[k];
        return (
          <button key={k} type="button" className="cup drink-btn" draggable={false} onClick={() => onPick(k)} aria-label={t.pour.add(name)}>
            <span style={{ position: 'relative', display: 'block', width: 64, height: 64 }}>
              <DrinkIcon drink={d} />
              <span aria-hidden="true" className="drink-badge" style={{ background: d.c }}>
                <PlusIcon size={12} stroke={LIGHT_BADGE.has(k) ? '#1E2340' : '#FFFFFF'} strokeWidth={5} />
              </span>
            </span>
            <span className="drink-label">{short}</span>
          </button>
        );
      })}
      <button type="button" className="cup drink-btn" draggable={false} onClick={onEdit} aria-label={t.picker.editLabel}>
        <span aria-hidden="true" className="drink-edit">
          <PlusIcon size={24} strokeWidth={3.2} />
        </span>
        <span className="drink-label">{t.picker.edit}</span>
      </button>
    </div>
  );
}
