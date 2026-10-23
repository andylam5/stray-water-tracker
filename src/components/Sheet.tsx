import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useT } from '../i18n';
import { CloseIcon } from './Icons';

interface SheetProps {
  title: string;
  onClose: () => void;
  /** Tall sheets reach near the top and scroll their body; short ones hug their content. */
  tall?: boolean;
  /** Stacking order, so a sheet opened from another sits on top of it. */
  layer?: number;
  children: ReactNode;
}

/** Open sheets, oldest first; only the top one answers Escape. */
const openSheets: symbol[] = [];

/** Bottom sheet with a dimmed backdrop. Escape, the backdrop and the close button dismiss it. */
export function Sheet({ title, onClose, tall = false, layer = 0, children }: SheetProps) {
  const titleId = useId();
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const me = Symbol(title);
    openSheets.push(me);
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === me) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openSheets.splice(openSheets.indexOf(me), 1);
      previous?.focus?.();
    };
    // Runs once per open; the title only names the stack entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const z = 7 + layer * 2;
  return (
    <>
      <div className="sheet-dim" aria-hidden="true" onClick={onClose} style={{ zIndex: z }} />
      <div className={`sheet-panel sheet-full ${tall ? 'is-tall' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ zIndex: z + 1 }}>
        <div aria-hidden="true" className="sheet-grip" />
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} type="button" className="icon-btn tap sheet-close" onClick={onClose} aria-label={t.common.closeNamed(title)}>
            <CloseIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

interface SwitchProps {
  on: boolean;
  onToggle: () => void;
  label?: string;
}

/** On/off switch. Pass `label` when there's no visible text naming it. */
export function Switch({ on, onToggle, label }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className="switch">
      <span aria-hidden="true" className="switch-knob" />
    </button>
  );
}

/** The track-and-knob visual alone, for rows where the whole row is the switch. */
export function SwitchVisual({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className="switch" data-on={on}>
      <span className="switch-knob" />
    </span>
  );
}
