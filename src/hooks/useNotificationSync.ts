import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { rescheduleAll } from '@/services/notifications';
import { useGameStore } from '@/store/gameStore';
import { settingsSnapshot, useSettingsStore } from '@/store/settingsStore';

/**
 * Keeps scheduled reminders in step with the user's habits and settings.
 *
 * Any change to a habit's title, schedule, reminder time or archived state, or
 * to the reminder/language settings, invalidates what is currently scheduled —
 * so the whole schedule is rebuilt rather than diffed. The counts are small and
 * a rebuild can't drift.
 */
export function useNotificationSync(): void {
  const habits = useGameStore((state) => state.habits);
  const notificationsOn = useSettingsStore((state) => state.notificationsOn);
  const language = useSettingsStore((state) => state.language);
  const { t } = useTranslation();

  useEffect(() => {
    void rescheduleAll(habits, settingsSnapshot(), {
      reminderTitle: t('notifications.reminder.title'),
      reminderBody: (habitTitle) => t('notifications.reminder.body', { title: habitTitle }),
      eveningTitle: t('notifications.evening.title'),
      eveningBody: (count) =>
        count === 1
          ? t('notifications.evening.bodyOne')
          : t('notifications.evening.bodyMany', { count }),
    });
    // `language` is a dependency because the scheduled copy is translated at
    // schedule time, not at delivery time.
  }, [habits, notificationsOn, language, t]);
}
