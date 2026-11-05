/**
 * Push notification copy for the server.
 *
 * The Edge Function can't load the app's i18next bundle, so the four strings it
 * needs are repeated here. `reminderCopy.test.ts` checks them against
 * `src/i18n/locales/*.json`, so the two can't drift apart.
 */

import type { ReminderCopy } from './reminderPlan.ts';
import { localizeStarterTitle } from './starterTitles.ts';

interface Templates {
  reminderTitle: string;
  reminderBody: string;
  eveningTitle: string;
  eveningBodyOne: string;
  eveningBodyMany: string;
}

export const TEMPLATES: Record<'en' | 'id', Templates> = {
  en: {
    reminderTitle: 'Majesty',
    reminderBody: "Quest {{title}} isn't done. Your people are waiting.",
    eveningTitle: 'Majesty',
    eveningBodyOne: '1 quest left before midnight.',
    eveningBodyMany: '{{count}} quests left before midnight.',
  },
  id: {
    reminderTitle: 'Paduka',
    reminderBody: 'Quest {{title}} belum selesai. Rakyatmu menunggu.',
    eveningTitle: 'Paduka',
    eveningBodyOne: '1 quest tersisa sebelum tengah malam.',
    eveningBodyMany: '{{count}} quest tersisa sebelum tengah malam.',
  },
};

export function copyFor(language: string | undefined): ReminderCopy {
  const lang = language === 'id' ? 'id' : 'en';
  const t = TEMPLATES[lang];
  return {
    reminderTitle: t.reminderTitle,
    reminderBody: (title) => t.reminderBody.replace('{{title}}', localizeStarterTitle(title, lang)),
    eveningTitle: t.eveningTitle,
    eveningBody: (count) =>
      count === 1 ? t.eveningBodyOne : t.eveningBodyMany.replace('{{count}}', String(count)),
  };
}
