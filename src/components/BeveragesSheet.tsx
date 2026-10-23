import { useState } from 'react';
import { useT } from '../i18n';
import { CATEGORIES, DRINK_LIST, type DrinkCategory, type DrinkKey } from '../lib/drinks';
import { usePrefs } from '../lib/storage';
import { DrinkIcon } from './DrinkIcon';
import { Sheet, Switch } from './Sheet';

/** Turn drinks on or off for the Home row, filtered by type. */
export function BeveragesSheet({ onClose }: { onClose: () => void }) {
  const { enabledDrinks, setEnabledDrinks } = usePrefs();
  const [filter, setFilter] = useState<DrinkCategory | 'all'>('all');
  const t = useT();
  const b = t.beverages;

  const toggle = (key: DrinkKey) => {
    const on = enabledDrinks.includes(key);
    // Keep catalog order so the Home row stays predictable.
    setEnabledDrinks(DRINK_LIST.map((d) => d.key).filter((k) => (k === key ? !on : enabledDrinks.includes(k))));
  };

  const shown = DRINK_LIST.filter((d) => filter === 'all' || d.cat === filter);

  return (
    <Sheet title={b.title} onClose={onClose} tall>
      <p className="sheet-note">{b.note}</p>
      <div role="group" aria-label={b.filter} className="filter-chips">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)} className="filter-chip">
            {c === 'all' ? t.categories.all(DRINK_LIST.length) : t.categories[c]}
          </button>
        ))}
      </div>
      <div className="sheet-body sheet-list" style={{ gap: 10 }}>
        {shown.map((d) => {
          const on = enabledDrinks.includes(d.key);
          const [name] = t.drinks[d.key];
          return (
            <div key={d.key} className="list-row" style={{ minHeight: 64 }}>
              <DrinkIcon drink={d} size={40} />
              <span className="list-row-text">
                <span className="list-row-title" style={{ fontSize: 17, fontWeight: 700 }}>{name}</span>
                {d.caffeine > 0 && <span className="list-row-sub">{b.caffeine(d.caffeine)}</span>}
              </span>
              <span className="hydration-pct" data-zero={d.hydration === 0} aria-label={b.counts(Math.round(d.hydration * 100))}>
                {Math.round(d.hydration * 100)}%
              </span>
              {d.key === 'water' ? (
                <span className="always">{b.always}</span>
              ) : (
                <Switch on={on} onToggle={() => toggle(d.key)} label={b.show(name)} />
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
