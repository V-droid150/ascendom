import { decideSync, type LocalSyncState } from '../policy';

const USER = 'user-1';
const T1 = '2026-11-04T10:00:00.000001+00:00';
const T2 = '2026-11-04T11:00:00.000001+00:00';

const synced: LocalSyncState = {
  hasHero: true,
  dirty: false,
  syncedUserId: USER,
  lastSyncedAt: T1,
};

describe('decideSync', () => {
  it('does nothing for a new player with no cloud save', () => {
    expect(
      decideSync(
        USER,
        { ...synced, hasHero: false, lastSyncedAt: null },
        { exists: false, updatedAt: null },
      ),
    ).toBe('none');
  });

  it('uploads a local hero when the account has no save yet', () => {
    expect(decideSync(USER, synced, { exists: false, updatedAt: null })).toBe('upload');
  });

  it('downloads onto a device that has no hero', () => {
    expect(decideSync(USER, { ...synced, hasHero: false }, { exists: true, updatedAt: T2 })).toBe(
      'download',
    );
  });

  it('asks when this device has never synced with this account', () => {
    expect(
      decideSync(
        USER,
        { ...synced, syncedUserId: null, lastSyncedAt: null },
        { exists: true, updatedAt: T1 },
      ),
    ).toBe('conflict');
    expect(
      decideSync(
        USER,
        { ...synced, syncedUserId: 'someone-else' },
        { exists: true, updatedAt: T1 },
      ),
    ).toBe('conflict');
  });

  it('does nothing when both sides are already in step', () => {
    expect(decideSync(USER, synced, { exists: true, updatedAt: T1 })).toBe('none');
  });

  it('uploads local changes when the cloud has not moved', () => {
    expect(decideSync(USER, { ...synced, dirty: true }, { exists: true, updatedAt: T1 })).toBe(
      'upload',
    );
  });

  it('downloads when only the cloud has moved on', () => {
    expect(decideSync(USER, synced, { exists: true, updatedAt: T2 })).toBe('download');
  });

  it('asks when both sides changed', () => {
    expect(decideSync(USER, { ...synced, dirty: true }, { exists: true, updatedAt: T2 })).toBe(
      'conflict',
    );
  });
});
