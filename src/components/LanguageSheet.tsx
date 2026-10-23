import { useT } from '../i18n';
import { LANGUAGES, type LangId } from '../lib/i18n';
import { usePrefs } from '../lib/storage';
import { Sheet } from './Sheet';

export function LanguageSheet({ onClose, layer }: { onClose: () => void; layer?: number }) {
  const { language, setLanguage } = usePrefs();
  const title = useT().settings.language;

  const pick = (id: LangId) => {
    setLanguage(id);
    onClose();
  };

  return (
    <Sheet title={title} onClose={onClose} tall layer={layer}>
      <div role="radiogroup" aria-label={title} className="sheet-body sheet-list">
        {LANGUAGES.map((l) => {
          const selected = l.id === language.id;
          return (
            <button key={l.id} type="button" role="radio" aria-checked={selected} lang={l.id} onClick={() => pick(l.id)} className="list-row lang-row">
              <span aria-hidden="true" className="lang-badge">{l.code}</span>
              <span className="list-row-text">
                <span className="list-row-title">{l.native}</span>
                <span lang="en" className="list-row-sub">{l.english}</span>
              </span>
              {selected && (
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D5FD1" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
