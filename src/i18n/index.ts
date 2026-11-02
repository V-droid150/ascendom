/**
 * i18n setup. Indonesian is the default and the source of truth for copy;
 * English is the fallback so a missing Indonesian key degrades to real text
 * rather than showing the key name.
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

export function initI18n(language: Language = 'id'): typeof i18n {
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
  void changeLanguage(language);
}

export default i18n;
