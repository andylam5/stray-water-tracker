export type LangId = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'hi';

export interface Language {
  id: LangId;
  /** Badge text in the picker. */
  code: string;
  /** Name in the language itself. */
  native: string;
  english: string;
}

export const LANGUAGES: Language[] = [
  { id: 'en', code: 'EN', native: 'English', english: 'English' },
  { id: 'es', code: 'ES', native: 'Español', english: 'Spanish' },
  { id: 'pt', code: 'PT', native: 'Português', english: 'Portuguese' },
  { id: 'fr', code: 'FR', native: 'Français', english: 'French' },
  { id: 'de', code: 'DE', native: 'Deutsch', english: 'German' },
  { id: 'it', code: 'IT', native: 'Italiano', english: 'Italian' },
  { id: 'ru', code: 'RU', native: 'Русский', english: 'Russian' },
  { id: 'zh-Hans', code: '简', native: '简体中文', english: 'Simplified Chinese' },
  { id: 'zh-Hant', code: '繁', native: '繁體中文', english: 'Traditional Chinese' },
  { id: 'ja', code: '日', native: '日本語', english: 'Japanese' },
  { id: 'ko', code: '한', native: '한국어', english: 'Korean' },
  { id: 'hi', code: 'हि', native: 'हिन्दी', english: 'Hindi' },
];

export const languageFor = (id: string | null): Language => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];

/** Short label for the Welcome language button: Latin codes as-is, otherwise the native name. */
export const shortLabel = (l: Language) => (/^[A-Z]{2,}$/.test(l.code) ? l.code : l.native);
