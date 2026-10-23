import { useEffect } from 'react';
import type { LangId } from '../lib/i18n';
import { usePrefs } from '../lib/storage';
import { de } from './de';
import { en, type Messages } from './en';
import { es } from './es';
import { fr } from './fr';
import { hi } from './hi';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { pt } from './pt';
import { ru } from './ru';
import { zhHans } from './zh-Hans';
import { zhHant } from './zh-Hant';

export type { Messages };

const MESSAGES: Record<LangId, Messages> = {
  en, es, pt, fr, de, it, ru, 'zh-Hans': zhHans, 'zh-Hant': zhHant, ja, ko, hi,
};

/** Copy for the chosen language. */
export function useT(): Messages {
  return MESSAGES[usePrefs().language.id];
}

/** Keeps `<html lang>` in step with the chosen language, for screen readers, fonts and hyphenation. */
export function useDocumentLang() {
  const { language } = usePrefs();
  useEffect(() => {
    document.documentElement.lang = language.id;
  }, [language.id]);
}

// ---- Locale formatting -----------------------------------------------------

// 2023-01-01 was a Sunday, so day `dow` of that week has weekday index `dow`.
const sampleDay = (dow: number) => new Date(2023, 0, 1 + dow);

/** Weekday name, 0 = Sunday. Capitalized, since it usually starts a label. */
export function weekdayName(dow: number, lang: LangId, width: 'long' | 'narrow' = 'long') {
  const name = sampleDay(dow).toLocaleDateString(lang, { weekday: width });
  return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
}

/** Time of day like "11:20 am" or "11:20", in the language's usual clock. */
export const clockTime = (hour: number, minute: number, lang: LangId) =>
  new Date(2023, 0, 1, hour, minute).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }).toLowerCase();

/** Short month name, like "OCT" or "10月". */
export const shortMonth = (d: Date, lang: LangId) => d.toLocaleDateString(lang, { month: 'short' }).toLocaleUpperCase(lang);
