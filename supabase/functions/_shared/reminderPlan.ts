/**
 * What reminders are due for one player right now.
 *
 * Pure and dependency-free so it runs unchanged in the Deno Edge Function and
 * under Jest. It mirrors the native schedule in `src/services/notifications.ts`
 * (a nudge at each daily quest's reminder time, and an evening check at
 * EVENING_CHECK_HOUR) but can do one thing native can't: it reads the logs, so
 * a quest that is already done is never nagged about.
 */

/** Same hour as native (`src/services/notifications.ts`). */
export const EVENING_CHECK_HOUR = 20;

/**
 * How far back a reminder still counts as due. Wider than the five-minute cron
 * so a late or skipped run still delivers; `push_sent` stops duplicates.
 */
export const DUE_WINDOW_MINUTES = 15;

const MINUTES_PER_HOUR = 60;
const MS_PER_HOUR = 3_600_000;

/** The parts of the save bundle this module reads. Everything is optional: saves are untrusted input. */
export interface SaveLike {
  game?: {
    onboarded?: boolean;
    habits?: {
      id: string;
      title: string;
      type: string;
      schedule?: number[];
      reminderTime?: string;
      archived?: boolean;
      isBad?: boolean;
    }[];
    logs?: { habitId: string; dayKey: string }[];
  };
  settings?: {
    language?: string;
    dayStartHour?: number;
    notificationsOn?: boolean;
  };
}

export interface ReminderCopy {
  reminderTitle: string;
  reminderBody: (habitTitle: string) => string;
  eveningTitle: string;
  eveningBody: (count: number) => string;
}

export interface PlannedPush {
  dayKey: string;
  /** Dedupe key within the day: 'habit:<id>' or 'evening'. */
  tag: string;
  title: string;
  body: string;
}

interface LocalTime {
  dayKey: string;
  weekday: number;
  minuteOfDay: number;
}

/** Wall-clock time in `timeZone`, shifted into the game day by `dayStartHour`. */
export function localGameTime(now: Date, timeZone: string, dayStartHour: number): LocalTime {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    // An unknown zone name: fall back to UTC rather than skip the player.
    return localGameTime(now, 'UTC', dayStartHour);
  }

  const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  const hour = part('hour');
  const minute = part('minute');

  // Treat the local wall time as if it were UTC, then do calendar maths on it.
  const wall = Date.UTC(part('year'), part('month') - 1, part('day'), hour, minute);
  const gameDay = new Date(wall - dayStartHour * MS_PER_HOUR);

  return {
    dayKey: gameDay.toISOString().slice(0, 10),
    weekday: gameDay.getUTCDay(),
    minuteOfDay: hour * MINUTES_PER_HOUR + minute,
  };
}

function parseMinutes(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * MINUTES_PER_HOUR + minute;
}

/** True when `target` passed within the last DUE_WINDOW_MINUTES (same calendar day only). */
function isDue(nowMinute: number, target: number): boolean {
  const elapsed = nowMinute - target;
  return elapsed >= 0 && elapsed < DUE_WINDOW_MINUTES;
}

export function planReminders(input: {
  now: Date;
  timeZone: string;
  save: SaveLike;
  copy: ReminderCopy;
  /** `${dayKey}|${tag}` entries already pushed. */
  alreadySent: ReadonlySet<string>;
}): PlannedPush[] {
  const { now, timeZone, save, copy, alreadySent } = input;
  const game = save.game;
  const settings = save.settings;
  if (!game?.onboarded || !settings?.notificationsOn) return [];

  const dayStartHour = Number.isInteger(settings.dayStartHour) ? Number(settings.dayStartHour) : 0;
  const time = localGameTime(now, timeZone, dayStartHour);

  const doneToday = new Set(
    (game.logs ?? []).filter((log) => log.dayKey === time.dayKey).map((log) => log.habitId),
  );
  const outstanding = (game.habits ?? []).filter(
    (habit) =>
      habit.type === 'daily' &&
      !habit.archived &&
      !habit.isBad &&
      (habit.schedule ?? []).includes(time.weekday) &&
      !doneToday.has(habit.id),
  );

  const planned: PlannedPush[] = [];
  const add = (tag: string, title: string, body: string): void => {
    if (alreadySent.has(`${time.dayKey}|${tag}`)) return;
    planned.push({ dayKey: time.dayKey, tag, title, body });
  };

  for (const habit of outstanding) {
    const at = parseMinutes(habit.reminderTime);
    if (at !== null && isDue(time.minuteOfDay, at)) {
      add(`habit:${habit.id}`, copy.reminderTitle, copy.reminderBody(habit.title));
    }
  }

  if (outstanding.length > 0 && isDue(time.minuteOfDay, EVENING_CHECK_HOUR * MINUTES_PER_HOUR)) {
    add('evening', copy.eveningTitle, copy.eveningBody(outstanding.length));
  }

  return planned;
}
