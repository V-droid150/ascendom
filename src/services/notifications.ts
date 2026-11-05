/**
 * Reminders.
 *
 * Native uses expo-notifications with per-habit daily triggers. A browser can't
 * schedule ahead like that, so on the web the server sends Web Push reminders
 * instead (`./webPush.ts`); this module schedules nothing there and only
 * forwards the permission request.
 *
 * Permission is never requested on launch; only when the user turns reminders
 * on in Settings.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Habit, Settings } from '@/types';
import { disableWebPush, enableWebPush, isWebPushSupported } from './webPush';

export type PermissionOutcome = 'granted' | 'denied' | 'unsupported' | 'signedOut';

/** The evening nudge fires at 20:00 local. */
export const EVENING_CHECK_HOUR = 20;

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<PermissionOutcome> {
  if (!isNative) return enableWebPush();

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Turning reminders off: on the web the server has to stop pushing to this browser. */
export async function disableReminders(): Promise<void> {
  if (!isNative) await disableWebPush();
}

export async function cancelAll(): Promise<void> {
  if (!isNative) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // A failure to clear is not worth interrupting the user over; the next
    // reschedule clears again before adding.
  }
}

interface ScheduleCopy {
  reminderTitle: string;
  reminderBody: (habitTitle: string) => string;
  eveningTitle: string;
  eveningBody: (count: number) => string;
}

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/**
 * Rebuilds every scheduled notification from scratch.
 *
 * Called whenever habits or settings change. Clearing and rescheduling is far
 * simpler to reason about than diffing, and the counts here are small.
 */
export async function rescheduleAll(
  habits: Habit[],
  settings: Settings,
  copy: ScheduleCopy,
): Promise<void> {
  if (!isNative) return;

  await cancelAll();
  if (!settings.notificationsOn) return;

  const active = habits.filter((habit) => !habit.archived && !habit.isBad);

  for (const habit of active) {
    if (!habit.reminderTime || habit.type !== 'daily') continue;

    const time = parseTime(habit.reminderTime);
    if (!time) continue;

    for (const weekday of habit.schedule) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: copy.reminderTitle,
            body: copy.reminderBody(habit.title),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            // expo-notifications counts weekdays from 1 = Sunday.
            weekday: weekday + 1,
            hour: time.hour,
            minute: time.minute,
          },
        });
      } catch {
        // One bad trigger must not abort the rest of the schedule.
      }
    }
  }

  const outstanding = active.filter((habit) => habit.type === 'daily').length;
  if (outstanding === 0) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.eveningTitle,
        body: copy.eveningBody(outstanding),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: EVENING_CHECK_HOUR,
        minute: 0,
      },
    });
  } catch {
    // Ignored for the same reason as above.
  }
}

export const NOTIFICATIONS_SUPPORTED = isNative || isWebPushSupported();
