/**
 * Starter quest titles follow the current language.
 *
 * Onboarding saves a starter quest's title as plain text in whatever language
 * was active at the time (English by default), so switching to Indonesian
 * later left "Drink 8 glasses of water" on the board. Rather than migrating
 * saves, a title that still exactly matches a starter suggestion in *any*
 * language is shown in the current one. A title the player typed or renamed
 * matches nothing and is shown as written.
 */

import en from './locales/en.json';
import id from './locales/id.json';

type Suggestions = Record<string, string>;

const SUGGESTIONS: readonly Suggestions[] = [
  en.onboarding.firstQuest.suggestions,
  id.onboarding.firstQuest.suggestions,
];

/** The starter quest key whose title this is, in any language, or null. */
export function starterKeyForTitle(title: string): string | null {
  const trimmed = title.trim();
  for (const suggestions of SUGGESTIONS) {
    for (const [key, text] of Object.entries(suggestions)) {
      if (text === trimmed) return key;
    }
  }
  return null;
}

/** `title` translated if it is an untouched starter quest, otherwise as is. */
export function localizedHabitTitle(title: string, t: (key: string) => string): string {
  const key = starterKeyForTitle(title);
  return key ? t(`onboarding.firstQuest.suggestions.${key}`) : title;
}
