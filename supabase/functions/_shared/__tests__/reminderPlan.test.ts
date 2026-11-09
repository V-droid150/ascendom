import en from '../../../../src/i18n/locales/en.json';
import id from '../../../../src/i18n/locales/id.json';
import { copyFor, TEMPLATES } from '../reminderCopy';
import { localizeStarterTitle, STARTER_TITLES } from '../starterTitles';
import { DUE_WINDOW_MINUTES, localGameTime, planReminders, type SaveLike } from '../reminderPlan';

const copy = copyFor('en');

/** 2026-11-05 is a Thursday (weekday 4). Jakarta is UTC+7. */
const jakarta = (hhmm: string, date = '2026-11-05'): Date => new Date(`${date}T${hhmm}:00+07:00`);

function save(overrides: Partial<NonNullable<SaveLike['game']>> = {}, settings = {}): SaveLike {
  return {
    game: {
      onboarded: true,
      habits: [
        {
          id: 'run',
          title: 'Morning run',
          type: 'daily',
          schedule: [0, 1, 2, 3, 4, 5, 6],
          reminderTime: '07:00',
        },
      ],
      logs: [],
      ...overrides,
    },
    settings: { language: 'en', dayStartHour: 0, notificationsOn: true, ...settings },
  };
}

const plan = (now: Date, s: SaveLike, sent: string[] = [], timeZone = 'Asia/Jakarta') =>
  planReminders({ now, timeZone, save: s, copy, alreadySent: new Set(sent) });

describe('localGameTime', () => {
  it('reads the wall clock of the given zone', () => {
    expect(localGameTime(jakarta('07:05'), 'Asia/Jakarta', 0)).toEqual({
      dayKey: '2026-11-05',
      weekday: 4,
      minuteOfDay: 7 * 60 + 5,
    });
  });

  it('keeps the small hours in the previous game day', () => {
    const time = localGameTime(jakarta('02:00'), 'Asia/Jakarta', 4);
    expect(time.dayKey).toBe('2026-11-04');
    expect(time.weekday).toBe(3);
    expect(time.minuteOfDay).toBe(120);
  });

  it('falls back to UTC for an unknown zone', () => {
    expect(localGameTime(new Date('2026-11-05T10:30:00Z'), 'Mars/Olympus', 0).minuteOfDay).toBe(
      630,
    );
  });
});

describe('planReminders', () => {
  it('sends a quest reminder inside the due window', () => {
    expect(plan(jakarta('07:03'), save())).toEqual([
      {
        dayKey: '2026-11-05',
        tag: 'habit:run',
        title: 'Majesty',
        body: "Quest Morning run isn't done. Your people are waiting.",
      },
    ]);
  });

  it('sends nothing before the time or after the window', () => {
    expect(plan(jakarta('06:59'), save())).toEqual([]);
    expect(
      plan(new Date(jakarta('07:00').getTime() + DUE_WINDOW_MINUTES * 60_000), save()),
    ).toEqual([]);
  });

  it('skips what was already sent today', () => {
    expect(plan(jakarta('07:05'), save(), ['2026-11-05|habit:run'])).toEqual([]);
  });

  it('skips a quest that is already done', () => {
    const done = save({ logs: [{ habitId: 'run', dayKey: '2026-11-05' }] });
    expect(plan(jakarta('07:05'), done)).toEqual([]);
  });

  it('skips unscheduled, archived, bad and one-time quests', () => {
    const base = save().game!.habits![0]!;
    const habits = [
      { ...base, id: 'a', schedule: [1] },
      { ...base, id: 'b', archived: true },
      { ...base, id: 'c', isBad: true },
      { ...base, id: 'd', type: 'quest' },
      { ...base, id: 'e', reminderTime: '7am' },
    ];
    expect(plan(jakarta('07:05'), save({ habits }))).toEqual([]);
  });

  it('respects the reminders switch and onboarding', () => {
    expect(plan(jakarta('07:05'), save({}, { notificationsOn: false }))).toEqual([]);
    expect(plan(jakarta('07:05'), save({ onboarded: false }))).toEqual([]);
    expect(plan(jakarta('07:05'), {})).toEqual([]);
  });

  it('nudges at 20:00 with the count of unfinished quests', () => {
    const base = save().game!.habits![0]!;
    const habits = [base, { ...base, id: 'read', reminderTime: undefined }];
    const [push] = plan(jakarta('20:01'), save({ habits }));
    expect(push).toMatchObject({ tag: 'evening', body: '2 quests left before midnight.' });
  });

  it('skips the evening nudge once everything is done', () => {
    const done = save({ logs: [{ habitId: 'run', dayKey: '2026-11-05' }] });
    expect(plan(jakarta('20:01'), done)).toEqual([]);
  });
});

describe('reminderCopy', () => {
  it.each([
    ['en', en],
    ['id', id],
  ] as const)('matches the %s locale file', (language, locale) => {
    const t = TEMPLATES[language];
    expect(t.reminderTitle).toBe(locale.notifications.reminder.title);
    expect(t.reminderBody).toBe(locale.notifications.reminder.body);
    expect(t.eveningTitle).toBe(locale.notifications.evening.title);
    expect(t.eveningBodyOne).toBe(locale.notifications.evening.bodyOne);
    expect(t.eveningBodyMany).toBe(locale.notifications.evening.bodyMany);
  });

  it('fills in titles and counts, defaulting to English', () => {
    expect(copyFor('id').eveningBody(1)).toBe('1 quest tersisa sebelum tengah malam.');
    expect(copyFor('fr').eveningBody(3)).toBe('3 quests left before midnight.');
  });
});

describe('starter quest titles in pushes', () => {
  it('mirrors the locale files exactly', () => {
    expect(STARTER_TITLES.en).toEqual(en.onboarding.firstQuest.suggestions);
    expect(STARTER_TITLES.id).toEqual(id.onboarding.firstQuest.suggestions);
  });

  it('names an English starter quest in Indonesian for an Indonesian player', () => {
    const body = copyFor('id').reminderBody(en.onboarding.firstQuest.suggestions.water);
    expect(body).toContain(id.onboarding.firstQuest.suggestions.water);
  });

  it('keeps titles the player wrote', () => {
    expect(localizeStarterTitle('Feed the cat', 'id')).toBe('Feed the cat');
  });
});

describe('planReminders on a broken save', () => {
  // A save is written by the player's own client; any of these used to throw
  // and stop the whole cron run for every player.
  const broken: [string, unknown][] = [
    ['a null save', null],
    ['a string game', { game: 'x', settings: { notificationsOn: true } }],
    [
      'habits that are not a list',
      { game: { onboarded: true, habits: 'x', logs: [] }, settings: { notificationsOn: true } },
    ],
    [
      'logs that are not a list',
      {
        game: { onboarded: true, habits: [], logs: { a: 1 } },
        settings: { notificationsOn: true },
      },
    ],
    [
      'null entries in habits and logs',
      {
        game: { onboarded: true, habits: [null, 3], logs: [null, 'x'] },
        settings: { notificationsOn: true },
      },
    ],
    [
      'a schedule that is not a list',
      {
        game: {
          onboarded: true,
          habits: [{ id: 'a', title: 't', type: 'daily', schedule: '4', reminderTime: '07:00' }],
          logs: [],
        },
        settings: { notificationsOn: true },
      },
    ],
    ['an impossible day start hour', save({}, { dayStartHour: 1e12 })],
    [
      'a non-string reminder time',
      save({
        habits: [{ id: 'a', title: 't', type: 'daily', schedule: [4], reminderTime: 700 as never }],
      }),
    ],
  ];

  it.each(broken)('does not throw on %s', (_label, data) => {
    expect(() => plan(jakarta('07:03'), data as SaveLike)).not.toThrow();
  });

  it('treats an impossible day start hour as midnight', () => {
    expect(plan(jakarta('07:03'), save({}, { dayStartHour: 99 }))).toHaveLength(1);
  });

  it('trims an absurdly long quest title in the push', () => {
    const long = save({
      habits: [
        {
          id: 'a',
          title: 'x'.repeat(500),
          type: 'daily',
          schedule: [4],
          reminderTime: '07:00',
        },
      ],
    });
    const [push] = plan(jakarta('07:03'), long);
    expect(push?.body.length).toBeLessThan(200);
  });
});
