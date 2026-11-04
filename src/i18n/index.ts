/**
 * i18n setup. English is what a first-time user sees; Indonesian is the
 * other supported language. English is also the fallback, so a missing
 * Indonesian key degrades to real text rather than showing the key name.
 */

// `use` is aliased because the react-hooks lint rule treats any `use*` call as
// a hook, and this one is i18next's plugin registration.
import i18n, { changeLanguage, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '@/types';
import en from './locales/en.json';
import id from './locales/id.json';

export const resources = {
  id: { translation: id },
  en: { translation: en },
} as const;

export const SUPPORTED_LANGUAGES: Language[] = ['id', 'en'];

export function initI18n(language: Language = 'en'): typeof i18n {
  if (!i18n.isInitialized) {
    void registerPlugin(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      defaultNS: 'translation',
      interpolation: { escapeValue: false },
      returnNull: false,
      compatibilityJSON: 'v4',
    });
  }
  return i18n;
}

export function setLanguage(language: Language): void {
  if (!i18n.isInitialized) initI18n(language);
  else void changeLanguage(language);
}

/**
 * Initialised at import time, not from an effect.
 *
 * `useTranslation` needs an i18next instance during the *first* render, and
 * effects run after it — worse, during the static web export effects never run
 * at all, so an effect-based init renders raw translation keys into the HTML.
 * The persisted language is applied afterwards by the root layout.
 */
initI18n('en');

export default i18n;
