import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { demoEnabled, hasDemoWeek, loadDemoWeek, removeDemoWeek, resetAllData } from '../lib/demo';
import { ROUTES } from '../lib/routes';
import { usePrefs } from '../lib/storage';
import { Sheet, SwitchVisual } from './Sheet';
import { Wave } from './Wave';

interface SettingsSheetProps {
  onClose: () => void;
  onOpenLanguage: () => void;
  onOpenBeverages: () => void;
  onClearToday: () => void;
}

function Chevron() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565D78" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function SettingsSheet({ onClose, onOpenLanguage, onOpenBeverages, onClearToday }: SettingsSheetProps) {
  const { units, goal, language, reminders, setUnit, setReminders } = usePrefs();
  const [demoLoaded] = useState(hasDemoWeek);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const navigate = useNavigate();
  const t = useT();
  const s = t.settings;

  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    onClearToday();
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAllData();
    navigate(ROUTES.welcome);
  };

  return (
    <Sheet title={s.title} onClose={onClose}>
      <div className="sheet-body" style={{ padding: '0 20px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link to={ROUTES.goal} state={{ from: 'settings' }} className="goal-card tap">
          <span aria-hidden="true" className="goal-card-sky" />
          <Wave layer="back" fill="#4FA3F7" style={{ top: 36, height: 16 }} />
          <Wave fill="#1D5FD1" style={{ top: 42, height: 12 }} />
          <span style={{ position: 'relative', fontSize: 40, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{units.fmt(goal)}</span>
          <span style={{ position: 'relative', marginTop: 4, fontSize: 15, fontWeight: 600 }}>{s.goal}</span>
        </Link>

        <div className="list-row settings-row" style={{ cursor: 'default' }}>
          <span style={{ flexGrow: 1 }}>{s.units}</span>
          <div role="group" aria-label={s.units} className="segmented">
            <button type="button" aria-pressed={!units.isOz} onClick={() => setUnit('ml')}>ml</button>
            <button type="button" aria-pressed={units.isOz} onClick={() => setUnit('oz')}>oz</button>
          </div>
        </div>

        <button type="button" className="list-row settings-row" onClick={onOpenLanguage} aria-haspopup="dialog">
          <span style={{ flexGrow: 1 }}>{s.language}</span>
          <span lang={language.id} style={{ fontSize: 15, color: 'var(--muted)' }}>{language.native}</span>
          <Chevron />
        </button>

        <button type="button" role="switch" aria-checked={reminders} className="list-row settings-row" onClick={() => setReminders(!reminders)}>
          <span style={{ flexGrow: 1 }}>{t.reminders.title}</span>
          <SwitchVisual on={reminders} />
        </button>

        <button type="button" className="list-row settings-row" onClick={onOpenBeverages}>
          <span style={{ flexGrow: 1 }}>{s.beverages}</span>
          <Chevron />
        </button>

        <button type="button" className="list-row settings-row" data-danger={confirmClear} onClick={clear} aria-live="polite">
          <span style={{ flexGrow: 1 }}>{confirmClear ? s.clearConfirm : s.clear}</span>
          <Chevron />
        </button>

        {demoEnabled() && (
          <>
            <button
              type="button"
              className="list-row settings-row"
              onClick={() => {
                if (demoLoaded) removeDemoWeek();
                else loadDemoWeek(goal);
                // Closing re-renders Home, which picks up the new streak.
                onClose();
              }}
            >
              <span style={{ flexGrow: 1 }}>{demoLoaded ? s.demoClear : s.demoLoad}</span>
              <Chevron />
            </button>
            <button type="button" className="list-row settings-row" data-danger={confirmReset} onClick={reset} aria-live="polite">
              <span style={{ flexGrow: 1 }}>{confirmReset ? s.resetConfirm : s.reset}</span>
              <Chevron />
            </button>
          </>
        )}

        <Link to={ROUTES.welcome} className="list-row settings-row" style={{ textDecoration: 'none' }}>
          <span style={{ flexGrow: 1 }}>{s.replay}</span>
          <Chevron />
        </Link>
      </div>
    </Sheet>
  );
}
