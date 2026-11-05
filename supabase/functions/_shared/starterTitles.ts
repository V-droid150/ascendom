/**
 * Starter quest titles for the server, mirroring `src/i18n/starterTitles.ts`.
 *
 * The Edge Function can't read the app's locale JSON, so the titles are
 * repeated here; the reminder tests check them against the locale files. A
 * habit whose title is still an untouched starter title in either language is
 * named in the player's language in the push.
 */

export const STARTER_TITLES: Record<'en' | 'id', Record<string, string>> = {
  en: {
    water: 'Drink 8 glasses of water',
    exercise: 'Exercise 15 minutes',
    read: 'Read 10 pages',
    sleep: 'Sleep before 11pm',
    walk: 'Walk 5000 steps',
    journal: 'Journaling',
  },
  id: {
    water: 'Minum 8 gelas air',
    exercise: 'Olahraga 15 menit',
    read: 'Baca 10 halaman',
    sleep: 'Tidur sebelum 23.00',
    walk: 'Jalan 5000 langkah',
    journal: 'Journaling',
  },
};

export function localizeStarterTitle(title: string, language: 'en' | 'id'): string {
  const trimmed = title.trim();
  for (const titles of Object.values(STARTER_TITLES)) {
    for (const [key, text] of Object.entries(titles)) {
      if (text === trimmed) return STARTER_TITLES[language][key] ?? title;
    }
  }
  return title;
}
