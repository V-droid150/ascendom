import {
  addDaysToKey,
  compareDayKeys,
  dayKeyRange,
  daysBetweenKeys,
  fromDayKey,
  isValidDayKey,
  toDayKey,
  weekKeyOf,
  weekdayOfKey,
} from '../dayKey';

/** Builds a local-time Date so the tests don't depend on the runner's zone. */
const at = (y: number, m: number, d: number, h = 0, min = 0): Date =>
  new Date(y, m - 1, d, h, min, 0, 0);

describe('toDayKey with dayStartHour 0', () => {
  it('uses the calendar date', () => {
    expect(toDayKey(at(2026, 3, 10, 13, 30), 0)).toBe('2026-03-10');
  });

  it('rolls over exactly at midnight', () => {
    expect(toDayKey(at(2026, 3, 10, 23, 59), 0)).toBe('2026-03-10');
    expect(toDayKey(at(2026, 3, 11, 0, 0), 0)).toBe('2026-03-11');
  });
});

describe('toDayKey with dayStartHour 4 (night owls)', () => {
  it('keeps the small hours on the previous day', () => {
    expect(toDayKey(at(2026, 3, 11, 0, 1), 4)).toBe('2026-03-10');
    expect(toDayKey(at(2026, 3, 11, 3, 59), 4)).toBe('2026-03-10');
  });

  it('starts the new day at the configured hour', () => {
    expect(toDayKey(at(2026, 3, 11, 4, 0), 4)).toBe('2026-03-11');
    expect(toDayKey(at(2026, 3, 11, 4, 1), 4)).toBe('2026-03-11');
  });

  it('still maps the evening to the same day', () => {
    expect(toDayKey(at(2026, 3, 10, 22, 0), 4)).toBe('2026-03-10');
  });

  it('shifts the whole boundary, not just midnight', () => {
    // 03:00 on the 11th belongs to the 10th; 03:00 on the 12th to the 11th.
    expect(toDayKey(at(2026, 3, 12, 3, 0), 4)).toBe('2026-03-11');
  });
});

describe('day arithmetic', () => {
  it('adds and subtracts days across month boundaries', () => {
    expect(addDaysToKey('2026-03-31', 1)).toBe('2026-04-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('handles a leap day', () => {
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToKey('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('measures signed distance', () => {
    expect(daysBetweenKeys('2026-03-10', '2026-03-01')).toBe(9);
    expect(daysBetweenKeys('2026-03-01', '2026-03-10')).toBe(-9);
    expect(daysBetweenKeys('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('compares keys', () => {
    expect(compareDayKeys('2026-03-01', '2026-03-02')).toBe(-1);
    expect(compareDayKeys('2026-03-02', '2026-03-01')).toBe(1);
    expect(compareDayKeys('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('parses back to local midnight', () => {
    const date = fromDayKey('2026-03-10');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(10);
    expect(date.getHours()).toBe(0);
  });
});

describe('dayKeyRange', () => {
  it('is inclusive at both ends', () => {
    expect(dayKeyRange('2026-03-01', '2026-03-03')).toEqual([
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
    ]);
  });

  it('returns a single day when both ends match', () => {
    expect(dayKeyRange('2026-03-01', '2026-03-01')).toEqual(['2026-03-01']);
  });

  it('returns nothing when the range is inverted', () => {
    expect(dayKeyRange('2026-03-05', '2026-03-01')).toEqual([]);
  });
});

describe('weekdayOfKey and weekKeyOf', () => {
  it('maps weekdays with Sunday as 0', () => {
    expect(weekdayOfKey('2026-03-08')).toBe(0); // Sunday
    expect(weekdayOfKey('2026-03-09')).toBe(1); // Monday
    expect(weekdayOfKey('2026-03-10')).toBe(2); // Tuesday
    expect(weekdayOfKey('2026-03-14')).toBe(6); // Saturday
  });

  it('anchors weeks to Monday', () => {
    expect(weekKeyOf('2026-03-09')).toBe('2026-03-09'); // Monday itself
    expect(weekKeyOf('2026-03-12')).toBe('2026-03-09'); // Thursday
    expect(weekKeyOf('2026-03-15')).toBe('2026-03-09'); // Sunday closes the week
  });

  it('gives every day of one week the same week key', () => {
    const keys = dayKeyRange('2026-03-09', '2026-03-15').map(weekKeyOf);
    expect(new Set(keys).size).toBe(1);
  });
});

describe('isValidDayKey', () => {
  it('accepts well-formed keys', () => {
    expect(isValidDayKey('2026-03-10')).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(isValidDayKey('2026-3-10')).toBe(false);
    expect(isValidDayKey('not-a-date')).toBe(false);
    expect(isValidDayKey('2026-02-30')).toBe(false);
    expect(isValidDayKey('')).toBe(false);
  });
});
